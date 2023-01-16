 import {EventEmitter, Injectable, Output} from '@angular/core';
 import { AngularFireAuth } from "@angular/fire/compat/auth";
 import {Observable, Subject} from 'rxjs';
 import firebase from "firebase/compat";

 @Injectable({providedIn: 'root'})

 export class AuthenticationService {
   userData: Observable<firebase.User>;

   @Output() eventEmitter: EventEmitter<any> = new EventEmitter<any>();

   loggedIn: boolean = false;

   private logInSubject$ = new Subject();
   logInObservable$ = this.logInSubject$.asObservable();

   constructor(private angularFireAuth: AngularFireAuth) {
     this.userData = angularFireAuth.authState;
   }

   get authStatus(): Observable<any> {
     return this.angularFireAuth.authState
   }

   get isLoggedIn() {
     console.log("login ", this.loggedIn);
     return this.loggedIn;
   }
   /* Sign up */
   SignUp(email: string, password: string) {
     this.angularFireAuth
       .createUserWithEmailAndPassword(email, password)
       .then(res => {
         console.log('You are Successfully signed up!', res);
         this.loggedIn = true;
       })
       .catch(error => {
         console.log('Something is wrong:', error.message);
         this.loggedIn = false;
       });
   }

   /* Sign in */
   SignIn(email: string, password: string) {
     this.angularFireAuth
       .signInWithEmailAndPassword(email, password)
       .then(res => {
         console.log("You're in!");
         this.eventEmitter.emit(true);
       })
       .catch(err => {
         console.log('Something went wrong:', err.message);
         this.eventEmitter.emit(false);
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
