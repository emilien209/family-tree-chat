/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

initializeApp();

const db = getFirestore();
const storage = getStorage();

// This function runs every hour to clean up old stories
export const cleanupOldStories = onSchedule("every 1 hours", async (event) => {
    logger.info("Running scheduled job to clean up old stories");

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const storiesRef = db.collection('stories');
    const oldStoriesQuery = storiesRef.where('timestamp', '<', twentyFourHoursAgo);

    try {
        const snapshot = await oldStoriesQuery.get();
        if (snapshot.empty) {
            logger.info("No old stories to delete.");
            return;
        }

        const batch = db.batch();
        const deletePromises: Promise<any>[] = [];

        snapshot.forEach(doc => {
            logger.info(`Marking story ${doc.id} for deletion.`);
            const storyData = doc.data();

            // Delete the image from Firebase Storage if it exists
            if (storyData.imageUrl && storyData.imageUrl.includes('firebasestorage')) {
                const url = new URL(storyData.imageUrl);
                const path = decodeURIComponent(url.pathname.split('/').pop()?.split('?')[0] ?? '');
                 if (path) {
                    const fullPath = path.substring(path.indexOf('stories/'));
                    logger.info(`Deleting image from storage: ${fullPath}`);
                    const fileRef = storage.bucket().file(fullPath);
                    deletePromises.push(fileRef.delete().catch(err => {
                         logger.error(`Failed to delete storage file ${fullPath}:`, err);
                    }));
                }
            }
            
            batch.delete(doc.ref);
        });

        // Wait for all storage deletions to be initiated
        await Promise.all(deletePromises);

        // Commit the Firestore batch delete
        await batch.commit();

        logger.info(`Successfully deleted ${snapshot.size} old stories.`);

    } catch (error) {
        logger.error("Error cleaning up old stories:", error);
    }
});
