import {
  Controller,
  Get,
  Param,
  Sse,
  UseGuards,
  NotFoundException,
  Request,
  MessageEvent,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';
import { Observable, interval, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { GrpcExecutorService } from '../grpc-executor/grpc-executor.service';
import { GrpcCallLogsService } from '../grpc-call-logs/grpc-call-logs.service';
import { Reflector } from '@nestjs/core';

@ApiTags('sse')
@Controller('sse')
export class SseController {
  constructor(
    private readonly grpcExecutorService: GrpcExecutorService,
    private readonly grpcCallLogsService: GrpcCallLogsService,
  ) {}

  @Get('executions/:executionId')
  @UseGuards(new JwtAuthGuard(new Reflector()))
  @ApiCookieAuth('access_token')
  @Sse()
  @ApiOperation({ summary: 'SSE stream for a specific gRPC execution (streaming)' })
  @ApiResponse({ status: 200, description: 'Server-Sent Events stream for execution', content: { 'text/event-stream': {} } })
  executionStream(@Param('executionId') executionId: string): Observable<MessageEvent> {
    const stream = this.grpcExecutorService.getExecutionStream(executionId);
    if (!stream) {
      throw new NotFoundException(`No active execution with ID: ${executionId}`);
    }

    const ping$ = interval(15000).pipe(
      map(() => ({
        data: JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }),
        type: 'ping',
      })),
    );

    const events$ = stream.pipe(
      map((event) => ({
        data: JSON.stringify(event),
        type: event.type,
      })),
    );

    return merge(events$, ping$) as Observable<MessageEvent>;
  }

  @Get('events')
  @UseGuards(new JwtAuthGuard(new Reflector()))
  @ApiCookieAuth('access_token')
  @Sse()
  @ApiOperation({ summary: 'SSE stream for user notifications (business events)' })
  @ApiResponse({ status: 200, description: 'Server-Sent Events for user notifications', content: { 'text/event-stream': {} } })
  userEvents(@Request() req: any): Observable<MessageEvent> {
    const ping$ = interval(20000).pipe(
      map(() => ({
        data: JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
        }),
        type: 'ping',
      })),
    );

    return ping$ as Observable<MessageEvent>;
  }

  @Get('admin/grpc-calls')
  @UseGuards(
    new JwtAuthGuard(new Reflector()),
    new RolesGuard(new Reflector()),
  )
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiCookieAuth('access_token')
  @Sse()
  @ApiOperation({ summary: 'Admin SSE stream for real-time gRPC call logs monitoring (MODERATOR/ADMIN)' })
  @ApiResponse({ status: 200, description: 'Server-Sent Events for admin monitoring', content: { 'text/event-stream': {} } })
  adminGrpcCallsStream(): Observable<MessageEvent> {
    const ping$ = interval(15000).pipe(
      map(() => ({
        data: JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }),
        type: 'ping',
      })),
    );

    const logs$ = this.grpcCallLogsService.logEvents$.pipe(
      map((log) => ({
        data: JSON.stringify({ type: 'grpc_call', log }),
        type: 'grpc_call',
      })),
    );

    return merge(logs$, ping$) as Observable<MessageEvent>;
  }
}
