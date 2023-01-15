 import {EventEmitter, Injectable, Output} from '@angular/core';
 import { AngularFireAuth } from "@angular/fire/compat/auth";
 import {Observable, Subject} from 'rxjs';
 import firebase from "firebase/compat";

 @Injectable({providedIn: 'root'})

 export class AuthenticationService {
   userData: Observable<firebase.User>;

   @Output() eventEmitter: EventEmitter<any> = new EventEmitter<any>();

   private logInSubject$ = new Subject();
   logInObservable$ = this.logInSubject$.asObservable();

   constructor(private angularFireAuth: AngularFireAuth) {
     this.userData = angularFireAuth.authState;
   }

   /* Sign up */
   SignUp(email: string, password: string) {
     this.angularFireAuth
       .createUserWithEmailAndPassword(email, password)
       .then(res => {
         console.log('You are Successfully signed up!', res);
       })
       .catch(error => {
         console.log('Something is wrong:', error.message);
       });
   }

   /* Sign in */
   SignIn(email: string, password: string) {
     this.angularFireAuth
       .signInWithEmailAndPassword(email, password)
       .then(res => {
         console.log("You're in!");
         this.eventEmitter.emit(true);
         this.logInSubject$.next(true);
       })
       .catch(err => {
         console.log('Something went wrong:', err.message);
         this.eventEmitter.emit(false);
         this.logInSubject$.next(false);
       });
   }

   /* Sign out */
   SignOut() {
     this.angularFireAuth
       .signOut();
   }

   getEmittedValue() {
     return this.eventEmitter;
   }
 }
