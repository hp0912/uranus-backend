import { Ctx, Get, JsonController } from "routing-controllers";
import { Service } from "typedi";
import { IHttpResult } from "../common/types/commom";

@JsonController('/debug')
@Service()
export class ProbeController {

  @Get('/vars')
  async probe(@Ctx() ctx): Promise<IHttpResult<null>> {
    return { code: 200, message: 'success', data: null };
  }
}