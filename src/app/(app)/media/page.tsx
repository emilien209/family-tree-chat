
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, startAfter, limit, getDocs, DocumentData, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Loader2, Grid } from 'lucide-react';

const MEDIA_PER_PAGE = 12;

const MediaSkeleton = () => (
    <div className="aspect-square">
        <Skeleton className="w-full h-full rounded-lg" />
    </div>
);

export default function MediaPage() {
    const [media, setMedia] = useState<DocumentData[]>([]);
    const [lastDoc, setLastDoc] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchMedia = useCallback(async () => {
        setLoading(true);
        try {
            const mediaQuery = query(
                collection(db, 'posts'),
                where('imageUrl', '!=', ''), // Filter for posts with media
                orderBy('imageUrl'), // Firestore requires orderBy on the same field as inequality
                orderBy('timestamp', 'desc'),
                limit(MEDIA_PER_PAGE)
            );
            const documentSnapshots = await getDocs(mediaQuery);
            const mediaData = documentSnapshots.docs.map(doc => doc.data());

            setMedia(mediaData);
            const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastDoc(lastVisible);
            if (documentSnapshots.empty || documentSnapshots.size < MEDIA_PER_PAGE) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching media:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMoreMedia = useCallback(async () => {
        if (!lastDoc || !hasMore) return;
        setLoadingMore(true);
        try {
            const mediaQuery = query(
                collection(db, 'posts'),
                 where('imageUrl', '!=', ''),
                orderBy('imageUrl'),
                orderBy('timestamp', 'desc'),
                startAfter(lastDoc),
                limit(MEDIA_PER_PAGE)
            );
            const documentSnapshots = await getDocs(mediaQuery);
            const mediaData = documentSnapshots.docs.map(doc => doc.data());

            setMedia(prev => [...prev, ...mediaData]);
            const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastDoc(lastVisible);
            if (documentSnapshots.empty || documentSnapshots.size < MEDIA_PER_PAGE) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching more media:", error);
        } finally {
            setLoadingMore(false);
        }
    }, [lastDoc, hasMore]);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center h-16 shrink-0 border-b px-6">
                <div className="flex items-center gap-2">
                    <Grid className="h-6 w-6" />
                    <h2 className="text-xl font-semibold font-headline">Media Gallery</h2>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {loading && [...Array(MEDIA_PER_PAGE)].map((_, i) => <MediaSkeleton key={i} />)}
                    
                    {!loading && media.map((item, index) => (
                        <Card key={index} className="overflow-hidden aspect-square">
                            <CardContent className="p-0 h-full w-full">
                                {item.mediaType && item.mediaType.startsWith('video') ? (
                                    <video
                                        src={item.imageUrl}
                                        controls
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.content || 'Family media'}
                                        fill
                                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                        loading="lazy"
                                        className="object-cover"
                                    />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {!loading && media.length === 0 && (
                    <div className="text-center text-muted-foreground py-16">
                        <p>No photos or videos have been posted yet.</p>
                    </div>
                )}
                
                {hasMore && !loading && (
                    <div className="flex justify-center mt-8">
                        <Button onClick={fetchMoreMedia} disabled={loadingMore}>
                            {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {loadingMore ? 'Loading...' : 'Load More'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
