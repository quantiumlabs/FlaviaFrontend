'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Mic, X } from 'lucide-react';

export default function CreateStoryPage() {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.error('Location error:', error)
      );
    }
  }, []);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles([...mediaFiles, ...files]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        setMediaFiles([...mediaFiles, audioFile]);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userLocation) {
      alert('Location not available');
      return;
    }

    const formData = new FormData();
    formData.append('content', content);
    formData.append('latitude', userLocation.latitude);
    formData.append('longitude', userLocation.longitude);
    
    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5522/stories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        router.push('/map');
      }
    } catch (error) {
      console.error('Error creating story:', error);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <Card>
        <CardContent className="space-y-4 p-4">
          <Textarea
            placeholder="Share your story..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-32"
          />
          
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="mr-2" /> Add Photos
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            
            <Button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
            >
              <Mic className="mr-2" />
              {isRecording ? 'Stop Recording' : 'Record Audio'}
            </Button>
          </div>

          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {mediaFiles.map((file, index) => (
                <div key={index} className="relative">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="w-full h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center">
                      Audio File
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2"
                    onClick={() => {
                      const newFiles = [...mediaFiles];
                      newFiles.splice(index, 1);
                      setMediaFiles(newFiles);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full"
          >
            Share Story
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}