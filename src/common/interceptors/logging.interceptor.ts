import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const now = new Date();
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const requestBody = request.body;
    const path = request.originalUrl;
    const queryParams = request.query;
    const method = request.method;
    const userAgent = request.headers['user-agent'];
    const clientIp = request.ip;

    console.log(
      `[REQ] ${method} ${path} ${now.toLocaleString(
        'kr',
      )} ${userAgent} ${clientIp}\nquery: ${JSON.stringify(
        queryParams,
      )}\nreq: ${JSON.stringify(requestBody)}`,
    );

    return next.handle().pipe(
      tap(() => {
        console.log(
          `[RES] ${method} ${path} ${now.toLocaleString('kr')} status: ${
            response.statusCode
          } ${new Date().getMilliseconds() - now.getMilliseconds()}ms`,
        );
      }),
    );
  }
}
