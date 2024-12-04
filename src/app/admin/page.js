'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const response = await fetch('http://192.168.15.5:5522/admin/stories', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            toast.error('You are not authorized to access this page');
            router.push('/map');
            return;
          }
          throw new Error('Failed to fetch stories');
        }

        const data = await response.json();
        setStories(data);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [router]);

  const handleDelete = async (storyId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this story?');
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`http://192.168.15.5:5522/stories/${storyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setStories(stories.filter(story => story.id !== storyId));
        toast.success('Story deleted successfully');
      } else {
        throw new Error('Failed to delete story');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete story');
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex justify-center items-center h-screen">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Admin Dashboard</CardTitle>
          <Button variant="ghost" onClick={() => router.push('/map')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Map
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stories.map((story) => (
                <TableRow key={story.id}>
                  <TableCell>{story.user.username}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {story.content}
                  </TableCell>
                  <TableCell>
                    {new Date(story.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {`${story.latitude.toFixed(4)}, ${story.longitude.toFixed(4)}`}
                  </TableCell>
                  <TableCell>
                    {Array.isArray(story.mediaUrls) && story.mediaUrls.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {story.mediaUrls.map((mediaUrl, index) => {
                          if (mediaUrl.startsWith('data:image/')) {
                            return (
                              <img
                                key={index}
                                src={mediaUrl}
                                alt={`story-image-${index}`}
                                width={50}
                                height={50}
                                className="rounded"
                              />
                            );
                          } else if (mediaUrl.startsWith('data:audio/')) {
                            return (
                              <audio key={index} controls className="w-full">
                                <source
                                  src={mediaUrl}
                                  type={mediaUrl.includes('audio/mpeg') ? 'audio/mpeg' : 'audio/wav'}
                                />
                                Your browser does not support the audio element.
                              </audio>
                            );
                          } else if (mediaUrl.startsWith('http') || mediaUrl.startsWith('https')) {
                            // Handling regular URLs for media (images/audio)
                            const isImage = mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i);
                            if (isImage) {
                              return (
                                <img
                                  key={index}
                                  src={mediaUrl}
                                  alt={`story-media-${index}`}
                                  width={50}
                                  height={50}
                                  className="rounded"
                                />
                              );
                            } else {
                              return (
                                <audio key={index} controls className="w-full">
                                  <source src={mediaUrl} />
                                  Your browser does not support the audio element.
                                </audio>
                              );
                            }
                          }
                          return null;
                        })}
                      </div>
                    ) : (
                      'No media'
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(story.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;