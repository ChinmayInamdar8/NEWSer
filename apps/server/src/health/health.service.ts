import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
    getHealthService(){
        return {
            Health :"the health is fine",
            status:"server is running on 100"
        }
    }
}
