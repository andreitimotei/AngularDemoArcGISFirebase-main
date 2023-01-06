import { Component } from "@angular/core";
import { Autentificare} from "../../services/database/autentificare"
import {FormGroup} from "@angular/forms";


@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
})
export class HomeComponent {

  constructor(private authenticationService:Autentificare) {

  }

  loginForm: FormGroup;
  loading = false;
  submitted = false;

  email: string;
  password: string;

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


  get f() { return this.loginForm.controls; }
}
