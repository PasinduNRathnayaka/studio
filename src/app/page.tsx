import ImageEditor from '@/components/ImageEditor';

export default function Home() {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-4xl font-bold tracking-tight font-headline sm:text-5xl md:text-6xl">
        CineMagic
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground sm:text-xl">
        Upload an image and let our AI suggest stunning cinematic color grades.
        Transform your photos with a single click.
      </p>
      <div className="mt-8 w-full">
        <ImageEditor />
      </div>
    </div>
  );
}
