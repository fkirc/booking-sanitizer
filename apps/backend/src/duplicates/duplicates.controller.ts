import { Controller, Get } from "@nestjs/common";
import { DuplicatesService } from "./duplicates.service";

@Controller("duplicates")
export class DuplicatesController {
  constructor(private readonly duplicatesService: DuplicatesService) {}

  @Get()
  getDuplicates() {
    return this.duplicatesService.getDuplicates();
  }
}
