import { NextResponse } from "next/server";
import { HttpStatus } from "./http-status";

export class HttpResponse {
  static ok<T>(data: T, message?: string): NextResponse {
    return NextResponse.json(
      { success: true, data, message },
      { status: HttpStatus.OK }
    );
  }

  static badRequest(message: string): NextResponse {
    return NextResponse.json(
      { success: false, message },
      { status: HttpStatus.BAD_REQUEST }
    );
  }

  static unauthorized(message: string = "Unauthorized"): NextResponse {
    return NextResponse.json(
      { success: false, message },
      { status: HttpStatus.UNAUTHORIZED }
    );
  }

  static forbidden(message: string = "Forbidden"): NextResponse {
    return NextResponse.json(
      { success: false, message },
      { status: HttpStatus.FORBIDDEN }
    );
  }

  static notFound(message: string = "Not Found"): NextResponse {
    return NextResponse.json(
      { success: false, message },
      { status: HttpStatus.NOT_FOUND }
    );
  }

  static unprocessableEntity(message: string): NextResponse {
    return NextResponse.json(
      { success: false, message },
      { status: HttpStatus.UNPROCESSABLE_ENTITY }
    );
  }

  static internalServerError(
    message: string = "Internal Server Error"
  ): NextResponse {
    return NextResponse.json(
      { success: false, message },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
