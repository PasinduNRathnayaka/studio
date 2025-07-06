'use client';

import { useState, useRef, useCallback, useEffect, type ChangeEvent } from 'react';
import { Upload, Download, Wand2, RefreshCw, Image as ImageIcon, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCinematicSuggestions } from '@/app/(actions)/ai';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { findFilter, type Filter, filters } from '@/lib/filters';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ImageEditor() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('ai');

  const [filterIntensity, setFilterIntensity] = useState(100);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [filteredImageData, setFilteredImageData] = useState<ImageData | null>(null);

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const editedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const handleReset = useCallback(() => {
    setOriginalImage(null);
    setEditedImage(null);
    setSuggestions([]);
    setSelectedFilter(null);
    setOriginalImageData(null);
    setFilteredImageData(null);
    setFilterIntensity(100);
    setActiveTab('ai');
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, []);

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a JPG or PNG image.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      handleReset();
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const drawAndCacheOriginalImage = useCallback(() => {
    const canvas = originalCanvasRef.current;
    const editedCanvas = editedCanvasRef.current;
    const imageUrl = originalImage;

    if (!canvas || !editedCanvas || !imageUrl) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const editedCtx = editedCanvas.getContext('2d', { willReadFrequently: true });

    if (!ctx || !editedCtx) return;

    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const maxWidth = 800;
      const scale = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      editedCanvas.width = canvas.width;
      editedCanvas.height = canvas.height;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      editedCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setOriginalImageData(imageData);
        setEditedImage(editedCanvas.toDataURL('image/jpeg'));
      } catch(e) {
        console.error("Error getting image data:", e);
        toast({ variant: 'destructive', title: 'CORS Error', description: 'Could not process the image due to security restrictions. Try a different image.' });
        handleReset();
      }
    };
    img.onerror = () => {
        toast({ variant: 'destructive', title: 'Image Error', description: 'Could not load the image.' });
    }
  }, [originalImage, toast, handleReset]);

  useEffect(() => {
    if (originalImage) {
      drawAndCacheOriginalImage();
    }
  }, [originalImage, drawAndCacheOriginalImage]);

  useEffect(() => {
    if (!originalImageData || !editedCanvasRef.current) return;
    
    const editedCanvas = editedCanvasRef.current;
    const ctx = editedCanvas.getContext('2d');
    if (!ctx) return;

    if (selectedFilter && filteredImageData) {
      setIsProcessing(true);
      setTimeout(() => {
        const finalImageData = ctx.createImageData(originalImageData.width, originalImageData.height);
        const intensity = filterIntensity / 100;
        const negIntensity = 1 - intensity;
        
        const origData = originalImageData.data;
        const filtData = filteredImageData.data;
  
        for (let i = 0; i < origData.length; i += 4) {
          finalImageData.data[i] = negIntensity * origData[i] + intensity * filtData[i];
          finalImageData.data[i+1] = negIntensity * origData[i+1] + intensity * filtData[i+1];
          finalImageData.data[i+2] = negIntensity * origData[i+2] + intensity * filtData[i+2];
          finalImageData.data[i+3] = origData[i+3];
        }
    
        ctx.putImageData(finalImageData, 0, 0);
        setEditedImage(editedCanvas.toDataURL('image/jpeg'));
        setIsProcessing(false);
      }, 0);
    } else {
        if (originalImageData) {
            ctx.putImageData(originalImageData, 0, 0);
            setEditedImage(editedCanvas.toDataURL('image/jpeg'));
        } else {
            setEditedImage(null);
        }
    }
  }, [selectedFilter, filterIntensity, originalImageData, filteredImageData]);

  const handleGetSuggestions = async () => {
    if (!originalImage) return;
    setIsLoading(true);
    setSuggestions([]);
    try {
      const result = await getCinematicSuggestions({ photoDataUri: originalImage });
      if (result && result.suggestedEdits.length > 0) {
        setSuggestions(result.suggestedEdits);
      } else {
        toast({
          variant: 'destructive',
          title: 'AI Error',
          description: 'Could not generate suggestions. Please try again.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: 'Failed to communicate with the AI service.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = (filterName: string) => {
    const filterFn = findFilter(filterName);
    if (!filterFn || !originalImageData) {
      toast({
        variant: 'destructive',
        title: 'Filter Not Available',
        description: `The filter "${filterName}" is not supported yet or image data is missing.`,
      });
      return;
    }
    
    setSelectedFilter(filterName);
    setFilterIntensity(100);

    setTimeout(() => {
      try {
        const newImageData = new ImageData(
          new Uint8ClampedArray(originalImageData.data),
          originalImageData.width,
          originalImageData.height
        );
        const filtered = filterFn(newImageData);
        setFilteredImageData(filtered);
        setActiveTab('adjust');
      } catch (error) {
        console.error("Error applying filter: ", error);
        toast({ variant: 'destructive', title: 'Filter Error', description: 'Could not apply the selected filter.' });
      }
    }, 10);
  };
  
  const handleDownload = () => {
    if (!editedImage || !editedCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = `cinemagic-${selectedFilter?.toLowerCase().replace(/\s/g, '-') ?? 'edit'}.jpg`;
    link.href = editedCanvasRef.current.toDataURL('image/jpeg', 0.9);
    link.click();
  };
  
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const increaseIntensity = useCallback(() => {
    setFilterIntensity(v => Math.min(100, v + 10));
  }, []);

  const decreaseIntensity = useCallback(() => {
    setFilterIntensity(v => Math.max(0, v - 10));
  }, []);

  return (
    <div className="space-y-8 w-full">
      {!originalImage ? (
         <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full h-80 border-2 border-dashed rounded-lg flex flex-col justify-center items-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileChange(e.target.files?.[0] || null)}
            className="hidden"
            accept="image/png, image/jpeg"
          />
          <div className="text-center p-8">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              {isDragging ? "Drop your image here" : "Drag & drop an image or click to upload"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">PNG or JPG</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon /> Original
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <canvas ref={originalCanvasRef} className="w-full h-auto rounded-md bg-muted" />
                </CardContent>
            </Card>
            <Card className="relative">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wand2 /> Cinematic Preview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isProcessing && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-lg">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Applying filter...</span>
                      </div>
                    )}
                    <canvas ref={editedCanvasRef} className="w-full h-auto rounded-md bg-muted" />
                </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <CardTitle>Editing Tools</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleReset}>
                    <Upload />
                    Upload New
                  </Button>
                  <Button onClick={handleDownload} disabled={!editedImage || isProcessing}>
                    <Download />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
                  <TabsTrigger value="manual">Manual Filters</TabsTrigger>
                  <TabsTrigger value="adjust" disabled={!selectedFilter}>Adjustments</TabsTrigger>
                </TabsList>
                <TabsContent value="ai" className="pt-6">
                  <div className="space-y-6">
                    <Button onClick={handleGetSuggestions} disabled={isLoading || suggestions.length > 0} className="w-full sm:w-auto">
                      <Wand2 />
                      {isLoading ? 'Getting suggestions...' : 'Get AI Suggestions'}
                      {isLoading && <RefreshCw className="ml-2 h-4 w-4 animate-spin" />}
                    </Button>
                    
                    {suggestions.length > 0 && (
                      <div className="space-y-4 pt-4">
                        <Separator />
                        <h4 className="font-medium">Suggested Looks</h4>
                        <div className="flex flex-wrap gap-3">
                          {suggestions.map((s) => (
                            <Button
                              key={s}
                              variant={selectedFilter === s ? 'default' : 'secondary'}
                              onClick={() => applyFilter(s)}
                              disabled={!findFilter(s) || isProcessing}
                              className="capitalize"
                            >
                              {s}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    {isLoading && (
                      <div className="space-y-4 pt-4">
                        <Separator />
                        <h4 className="font-medium">Suggested Looks</h4>
                        <div className="flex flex-wrap gap-3">
                          <Skeleton className="h-10 w-24 rounded-md" />
                          <Skeleton className="h-10 w-28 rounded-md" />
                          <Skeleton className="h-10 w-20 rounded-md" />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="manual" className="pt-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">All Filters</h4>
                    <div className="flex flex-wrap gap-3">
                      {Object.keys(filters).map((filterName) => (
                        <Button
                          key={filterName}
                          variant={selectedFilter === filterName ? 'default' : 'secondary'}
                          onClick={() => applyFilter(filterName)}
                          disabled={isProcessing}
                          className="capitalize"
                        >
                          {filterName}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="adjust" className="pt-6">
                  {selectedFilter ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium capitalize">{selectedFilter} Level</h4>
                        <span className="text-sm text-muted-foreground font-mono">{filterIntensity}%</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={decreaseIntensity} disabled={isProcessing || filterIntensity === 0}>
                          <Minus />
                          <span className="sr-only">Decrease Level</span>
                        </Button>
                        <Progress value={filterIntensity} className="flex-1" />
                        <Button variant="outline" size="icon" onClick={increaseIntensity} disabled={isProcessing || filterIntensity === 100}>
                          <Plus />
                          <span className="sr-only">Increase Level</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>Select a filter to make adjustments.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
