import {Component, EventEmitter, OnInit, Output} from "@angular/core";
import { AuthenticationService} from "../../services/database/authentication.service"
import {FormGroup} from "@angular/forms";
import {Subscription} from "rxjs";


@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit{

  logInSubscription: Subscription = new Subscription()

  constructor(private authenticationService:AuthenticationService) {

  }

  logInMessage: string;

  loginForm: FormGroup;
  loading = false;
  submitted = false;

  email: string;
  password: string;

  ngOnInit() {
    this.logInSubscription = this.authenticationService.getEmittedValue().subscribe(
      response => {
        if (response) {
          this.successMessage();
        } else {
          this.errorMessage();
        }
      }
    )
  }

  signUp() {
    this.authenticationService.SignUp(this.email, this.password);
    this.email = '';
    this.password = '';
  }

  signIn() {
    this.authenticationService.SignIn(this.email, this.password);
    this.email = '';
    this.password = '';
  }

  signOut() {
   this.authenticationService.SignOut();
  }

  onSubmit() {

  }

  successMessage() {
    this.logInMessage = 'You are logged in';
  }

  errorMessage() {
    this.logInMessage = 'The username or password do not match any existing account. Try again or create a new account'
  }


  get f() { return this.loginForm.controls; }
}
