import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as reviewController from './review.controller';

const router = Router();

// Public route: Store reviews with dynamic rating aggregation
router.get('/store/:storeId', reviewController.getStoreReviews);

// Authenticated Customer / User routes
router.post('/', requireAuth, reviewController.createReview);
router.get('/order/:orderId', requireAuth, reviewController.getReviewByOrderId);
router.get('/:reviewId', requireAuth, reviewController.getReviewById);
router.patch('/:reviewId', requireAuth, reviewController.updateReview);
router.delete('/:reviewId', requireAuth, reviewController.deleteReview);

export default router;
