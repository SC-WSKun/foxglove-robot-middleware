import { Controller, Get } from "@nestjs/common";
import { LabelService } from "./label.service";

@Controller('label')
export class LabelController{
    constructor(private labelService: LabelService){}
    
    @Get()
    async getAllLabel(){
        return this.labelService.getLabelList();
    }

}