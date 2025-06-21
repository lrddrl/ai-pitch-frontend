import React from "react";

type Props = {
  files: File[];
  onRemove: (idx: number) => void;
};

const PdfFileList: React.FC<Props> = ({ files, onRemove }) => (
  <div className="flex flex-wrap gap-4 mt-4">
    {files.map((file, idx) => (
      <div
        key={file.name + file.size + idx}
        className="flex items-center px-4 py-2 bg-white rounded-lg shadow border"
      >
        <span className="text-2xl mr-2">📄</span>
        <span className="mr-2 max-w-[160px] truncate">{file.name}</span>
        <button
          onClick={() => onRemove(idx)}
          className="text-red-500 ml-2 hover:underline"
          type="button"
        >
          Remove
        </button>
      </div>
    ))}
  </div>
);

export default PdfFileList;
