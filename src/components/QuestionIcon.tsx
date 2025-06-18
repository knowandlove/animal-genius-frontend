export function QuestionIcon({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center bg-gray-100 rounded-full`}>
      <span className="text-4xl text-gray-400 font-bold">?</span>
    </div>
  );
}