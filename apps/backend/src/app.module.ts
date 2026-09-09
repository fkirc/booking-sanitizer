import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { DataSourcesModule } from "./data-sources/data-sources.module";
import { InsightsModule } from "./insights/insights.module";
import { AnomaliesModule } from "./anomalies/anomalies.module";

@Module({
  imports: [PrismaModule, DataSourcesModule, InsightsModule, AnomaliesModule],
})
export class AppModule {}
