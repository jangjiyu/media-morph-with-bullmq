import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const method = request.method;
    const path = request.url;
    const userAgent = request.headers['user-agent'];
    const clientIp = request.ip;

    const err = {
      message: exception.response || 'An unexpected error occurred',
      statusCode: exception.status || HttpStatus.INTERNAL_SERVER_ERROR,
    };

    const errText = `[ExceptionError] ${method} ${path} userId: ${request?.user?.userId} nickname: ${request?.user?.nickname} userAgent: ${userAgent} clientIp: ${clientIp}`;

    console.log(errText, exception);

    response.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
    });
  }
}
