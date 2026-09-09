import { Controller, Get, Param, Post } from "@nestjs/common";
import { DataSourcesService } from "./data-sources.service";

@Controller("data-sources")
export class DataSourcesController {
  constructor(private readonly dataSourcesService: DataSourcesService) {}

  @Get("imports")
  listImports() {
    return this.dataSourcesService.listImports();
  }

  @Get("imports/:id")
  getImportDetail(@Param("id") id: string) {
    return this.dataSourcesService.getImportDetail(id);
  }

  @Post("import")
  triggerImport() {
    return this.dataSourcesService.importSampleData();
  }
}
