import { Module } from "@nestjs/common";
import { LabelController } from "./label.controller";
import { LabelService } from "./label.service";
import { FoxgloveModule } from "../foxglove/foxglove.module";

@Module({
    imports: [FoxgloveModule],
    controllers: [LabelController],
    providers: [LabelService],
})
export class LabelModule{}