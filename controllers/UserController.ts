import { /* Authorized, Body, CurrentUser, */ Get, JsonController/* , Post, QueryParam */ } from "routing-controllers";
import { /* Inject, */ Service } from "typedi";

@JsonController('/user')
@Service()
export class UserController {

  @Get("/login")
  async login() {
    return 123;
  }

}