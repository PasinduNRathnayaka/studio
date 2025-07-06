import { generateAboutSection } from '@/ai/flows/generate-about-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export default async function AboutPage() {
  const aboutContent = await generateAboutSection({
    appName: 'CineMagic',
    primaryColor: 'Deep Blue (#3498DB)',
    backgroundColor: 'Dark Gray (#34495E)',
    accentColor: 'Soft Teal (#2ECC71)',
    font: 'Inter',
  });

  return (
    <div className="flex flex-col items-center">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lightbulb className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">About CineMagic</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            {aboutContent.aboutSectionContent.split('\n').map((paragraph, index) => (
              paragraph && <p key={index}>{paragraph}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
