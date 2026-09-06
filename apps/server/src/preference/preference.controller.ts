import { BadRequestException, Body, Controller, Delete, Get, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/role.decorator';
import { Request, Response } from '@nestjs/common';
import { createPreferenceSchema } from '@workspace/types';
import { PreferenceService } from './preference.service';

@Controller('preference')
export class PreferenceController {

    constructor(private readonly preferenceService : PreferenceService){}


    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async getAllPreference(){
        const preference = await this.preferenceService.getAllPreference();
        return {
            message:"Preference retrived successfully",
            data:preference
        }
    }


    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async createPreference(@Body() body : unknown){
        const parsedBody = createPreferenceSchema.safeParse(body)
        if(!parsedBody.success){
            throw new BadRequestException({
                message : "Invalid Preference Data",
                errors : parsedBody.error.issues
            })
        }

        const preference = await this.preferenceService.createPrefeerence(parsedBody.data);

        return {
            message:"Preference created successfully",
            data:preference
        }
    }

    @Delete()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async deltePreference(@Query() query : {id:string}){
        console.log(query);
        const deletedPreference = await this.preferenceService.deletePreference(query.id);

        return{
            message:"Preference deleted successfully",
            data:deletedPreference
        }
    }

    @Put()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async updatePreference(@Query() query : {id:string}, @Body() body : unknown){
        // const parsedBody = 
    }
}
