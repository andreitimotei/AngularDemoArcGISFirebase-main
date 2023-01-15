import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {
  constructor(private db: AngularFirestore) { }

  getReviews() {
    return new Promise<any>((resolve => {
      this.db.collection('reviews').valueChanges({idField: 'id'}).subscribe(reviews => {
        resolve(reviews)
      });
    }))
  }

  addNewReview(id, storeId, rating, feedback) {
    this.db.collection("reviews").doc(id).set({rating: rating, feedback: feedback, storeId: storeId})
  }
}
