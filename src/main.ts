import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.use(cookieParser());
  
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('gRPC IDE API')
    .setDescription('REST API for gRPC IDE backend. GraphQL available at /graphql.')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .addTag('auth', 'Authentication endpoints')
    .addTag('proto', 'Proto schema upload/download')
    .addTag('grpc', 'gRPC execution endpoints')
    .addTag('sse', 'Server-Sent Events endpoints')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
  console.log(`Application running on port ${process.env.PORT || 3000}`);
  console.log(`Swagger UI: http://localhost:${process.env.PORT || 3000}/api`);
  console.log(`GraphQL: http://localhost:${process.env.PORT || 3000}/graphql`);
}
bootstrap();
