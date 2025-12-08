// src/config.ts
import path from "path";


export const UPLOAD_TMP_DIR =
  process.env.UPLOAD_TMP_DIR || path.join(process.cwd(), "uploads_tmp");

// 合并后文件存放目录
export const UPLOAD_MERGED_DIR =
  process.env.UPLOAD_MERGED_DIR || path.join(process.cwd(), "uploads_merged");

// 文件记录（元数据）保存的 JSON 文件路径
export const FILE_RECORD_PATH =
  process.env.FILE_RECORD_PATH ||
  path.join(process.cwd(), "uploads_records.json");

