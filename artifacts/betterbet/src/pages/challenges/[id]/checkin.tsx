import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRoute, useLocation } from "wouter";
import { useCreateCheckin, useGetUploadUrl, getGetChallengeSummaryQueryKey } from "@workspace/api-client-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Loader2, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function Checkin() {
  const [, params] = useRoute("/challenges/:id/checkin");
  const challengeId = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const getUploadUrl = useGetUploadUrl();
  const createCheckin = useCreateCheckin();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleClearImage = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!file && !note.trim()) {
      toast({ title: "Provide proof", description: "Please upload a photo or write a note.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    let photoUrl = null;

    try {
      // 1. Upload photo if exists
      if (file) {
        const urlRes = await getUploadUrl.mutateAsync({
          challengeId,
          data: { filename: file.name, contentType: file.type }
        });
        
        // PUT to S3/GCS
        const uploadResponse = await fetch(urlRes.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });
        
        if (!uploadResponse.ok) throw new Error("Failed to upload image");
        
        photoUrl = urlRes.publicUrl;
      }

      // 2. Create Checkin record
      await createCheckin.mutateAsync({
        challengeId,
        data: {
          date: format(new Date(), "yyyy-MM-dd"),
          photoUrl,
          note: note.trim() || null
        }
      });

      queryClient.invalidateQueries({ queryKey: getGetChallengeSummaryQueryKey(challengeId) });
      
      toast({ title: "Checked In!", description: "Way to stay accountable.", variant: "default" });
      setLocation(`/challenges/${challengeId}`);
      
    } catch (error) {
      toast({ title: "Error", description: "Could not submit check-in. Try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  if (!challengeId) return null;

  return (
    <Layout showNav={false}>
      <div className="p-4 pt-6 space-y-6 flex flex-col h-full">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => setLocation(`/challenges/${challengeId}`)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-extrabold tracking-tight">Today's Check-in</h1>
        </div>

        <Card className="border-border shadow-md flex-1">
          <CardHeader>
            <CardTitle className="text-center text-lg">Upload Photo Proof</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Photo Uploader */}
            <div className="flex justify-center">
              <input 
                type="file" 
                accept="image/*"
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              
              {preview ? (
                <div className="relative w-full aspect-square max-w-sm rounded-xl overflow-hidden border-4 border-primary/20 shadow-inner">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                    onClick={handleClearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="w-full aspect-square max-w-sm rounded-xl border-dashed border-2 border-muted flex flex-col items-center justify-center bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                    <Camera className="h-10 w-10 text-primary" />
                  </div>
                  <p className="font-bold">Tap to take photo</p>
                  <p className="text-sm text-muted-foreground mt-1">or choose from gallery</p>
                </div>
              )}
            </div>

            {/* Note Input */}
            <div className="space-y-2">
              <label className="font-semibold text-sm">Add a note (optional)</label>
              <Textarea 
                placeholder="Crushed it today..." 
                className="resize-none h-24"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button 
              className="w-full h-14 text-lg font-bold mt-4" 
              onClick={handleSubmit}
              disabled={isUploading || (!file && !note.trim())}
            >
              {isUploading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="mr-2 h-5 w-5" /> Submit Check-in</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
