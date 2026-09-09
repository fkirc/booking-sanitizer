import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { DataSourcesModule } from "./data-sources/data-sources.module";
import { InsightsModule } from "./insights/insights.module";

@Module({
  imports: [PrismaModule, DataSourcesModule, InsightsModule],
})
export class AppModule {}
