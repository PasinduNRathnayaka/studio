'use client';

import { useState, useRef, useCallback, useEffect, type ChangeEvent } from 'react';
import { Upload, Download, Wand2, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCinematicSuggestions } from '@/app/(actions)/ai';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { findFilter, type Filter } from '@/lib/filters';
import { Separator } from '@/components/ui/separator';

export default function ImageEditor() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const editedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

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
      setOriginalImage(e.target?.result as string);
      setEditedImage(null);
      setSuggestions([]);
      setSelectedFilter(null);
    };
    reader.readAsDataURL(file);
  };

  const drawImageOnCanvas = useCallback((canvas: HTMLCanvasElement | null, imageUrl: string, filter?: Filter) => {
    const canvasEl = canvas;
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      const maxWidth = 800;
      const scale = Math.min(maxWidth / img.width, 1);
      canvasEl.width = img.width * scale;
      canvasEl.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvasEl.width, canvasEl.height);

      if (filter) {
        setIsProcessing(true);
        setTimeout(() => {
          try {
            let imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
            imageData = filter(imageData);
            ctx.putImageData(imageData, 0, 0);
            setEditedImage(canvasEl.toDataURL('image/jpeg'));
          } catch (error) {
            console.error("Error applying filter: ", error);
            toast({ variant: 'destructive', title: 'Filter Error', description: 'Could not apply the selected filter.' });
          } finally {
            setIsProcessing(false);
          }
        }, 50);
      } else {
        setEditedImage(null);
      }
    };
    img.onerror = () => {
        toast({ variant: 'destructive', title: 'Image Error', description: 'Could not load the image.' });
    }
  }, [toast]);

  useEffect(() => {
    if (originalImage) {
      drawImageOnCanvas(originalCanvasRef.current, originalImage);
      drawImageOnCanvas(editedCanvasRef.current, originalImage);
    }
  }, [originalImage, drawImageOnCanvas]);

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
    if (!filterFn || !originalImage) {
      toast({
        variant: 'destructive',
        title: 'Filter Not Available',
        description: `The filter "${filterName}" is not supported yet.`,
      });
      return;
    }
    setSelectedFilter(filterName);
    drawImageOnCanvas(editedCanvasRef.current, originalImage, filterFn);
  };
  
  const handleDownload = () => {
    if (!editedImage || !editedCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = `cinemagic-edit.jpg`;
    link.href = editedCanvasRef.current.toDataURL('image/jpeg');
    link.click();
  };

  const handleReset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setSuggestions([]);
    setSelectedFilter(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
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
                <CardTitle>Editing Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-4 items-center">
                  <Button onClick={handleGetSuggestions} disabled={isLoading || suggestions.length > 0}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {isLoading ? 'Getting suggestions...' : 'Get AI Suggestions'}
                    {isLoading && <RefreshCw className="ml-2 h-4 w-4 animate-spin" />}
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload New Image
                  </Button>
                  {editedImage && selectedFilter && (
                      <Button onClick={handleDownload}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                      </Button>
                  )}
              </div>
              
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
                        disabled={!findFilter(s)}
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
