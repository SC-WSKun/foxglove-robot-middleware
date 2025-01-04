import { Injectable, Logger } from '@nestjs/common'
import { FoxgloveService } from '../foxglove/foxglove.service'
import { to } from 'await-to-js'

@Injectable()
export class LabelService {
    private readonly logger = new Logger(LabelService.name)
    constructor(private foxgloveService: FoxgloveService) { }
    async getLabelList() {
        this.logger.log('--- start get labels ---')
        try {
            const [error, result] = await to(this.foxgloveService.callService("/label_manager/get_labels"))
            if (error) {
                throw error
            }
            else {
                this.logger.log(result)
                this.logger.log('--- get labels success ---')
                return result
            }
        }
        catch (error) {
            this.logger.error(error)
        }
    }
}
