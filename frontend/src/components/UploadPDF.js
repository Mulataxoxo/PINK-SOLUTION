import React from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";


const UploadPDF = ({ onUpload, id, typ = "pdf_zlecenie" }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [] },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      const formData = new FormData();
formData.append("typ", typ);  // dodaj najpierw typ!
formData.append("plik", acceptedFiles[0]);  // dopiero potem plik!

try {
  const res = await axios.post(`http://localhost:5001/api/oficjalne_trasy/${id}/upload`, formData);
  onUpload(`/uploads/${typ.replace("pdf_", "").replace("zdjecie", "zdj_z_trasy")}/${res.data.filename}`);

} catch (err) {
  console.error("❌ Błąd uploadu PDF:", err.response?.data || err.message);
}

    },
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-4 rounded text-center cursor-pointer ${
        isDragActive ? "bg-green-100 border-green-400" : "border-gray-300"
      }`}
    >
      <input {...getInputProps()} />
      {isDragActive
        ? "Upuść tutaj PDF"
        : "Przeciągnij i upuść plik PDF tutaj lub kliknij"}
    </div>
  );
};

export default UploadPDF;
