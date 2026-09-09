import { Controller, Get } from "@nestjs/common";
import { AnomaliesService } from "./anomalies.service";

@Controller("anomalies")
export class AnomaliesController {
  constructor(private readonly anomaliesService: AnomaliesService) {}

  @Get()
  getAnomalies() {
    return this.anomaliesService.getAnomalies();
  }
}
