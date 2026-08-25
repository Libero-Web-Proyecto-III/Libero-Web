import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  getPing() {
    
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    return {
      version: '1.0.0',
      timestamp,
      uptime,
      uptimeSeg: Math.floor( uptime * 1000 )
    }
  }
}
