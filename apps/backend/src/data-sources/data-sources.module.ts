import { Module } from "@nestjs/common";
import { DataSourcesController } from "./data-sources.controller";
import { DataSourcesService } from "./data-sources.service";

@Module({
  controllers: [DataSourcesController],
  providers: [DataSourcesService],
})
export class DataSourcesModule {}
