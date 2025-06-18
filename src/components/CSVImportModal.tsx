import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileSpreadsheet, CheckCircle, X } from "lucide-react";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  onImportComplete?: () => void;
}

interface StudentPreview {
  name: string;
  personalityType: string;
  animalType: string;
  learningStyle: string;
}

export function CSVImportModal({ isOpen, onClose, classId, onImportComplete }: CSVImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<{
    message: string;
    students: StudentPreview[];
  } | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/classes/${classId}/import-students`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult(result);
        toast({
          title: "Import successful!",
          description: result.message,
        });
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        throw new Error(result.message || "Import failed");
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Students from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with student data to import into your class
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* CSV Format Instructions */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Required CSV Format:</h4>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm">
                firstName,lastInitial,gradeLevel,personalityType<br />
                "Emma","T","5th Grade","ENFP"<br />
                "Liam","R","6th Grade","ISTJ"
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                <strong>Supported personality types:</strong><br />
                ESTJ → Meerkat, ISFJ → Panda, INTJ → Owl, ISTJ → Beaver<br />
                ESFJ → Elephant, ENFP → Otter, ESFP → Parrot, ENFJ → Border Collie
              </div>
            </CardContent>
          </Card>

          {/* File Upload Area */}
          {!importResult && (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
              <div className="text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="mb-4">
                  <label
                    htmlFor="csv-file"
                    className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Choose CSV File
                  </label>
                  <input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold">Import Complete</h4>
                </div>
                <p className="mb-4">{importResult.message}</p>
                
                <div className="max-h-60 overflow-y-auto">
                  <h5 className="font-medium mb-2">Imported Students:</h5>
                  <div className="space-y-2">
                    {importResult.students.map((student, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="font-medium">{student.name}</span>
                        <div className="text-sm text-muted-foreground">
                          {student.personalityType} → {student.animalType} ({student.learningStyle})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              {importResult ? "Close" : "Cancel"}
            </Button>
            {!importResult && (
              <Button
                onClick={handleImport}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? "Importing..." : "Import Students"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}