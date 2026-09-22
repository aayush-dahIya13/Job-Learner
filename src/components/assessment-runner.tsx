"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentQuestion } from "@/lib/student-assessment";

type AssessmentRunnerProps = {
  attemptId: number;
  assessmentTitle: string;
  durationMinutes: number;
  questions: AssessmentQuestion[];
};

export function AssessmentRunner({
  attemptId,
  assessmentTitle,
  durationMinutes,
  questions,
}: AssessmentRunnerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Restore saved answers from localStorage if present (for refresh resilience)
  useEffect(() => {
    try {
      const savedKey = `jl_assessment_answers_${attemptId}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        setAnswers(JSON.parse(saved));
      }
    } catch (e) {
      // ignore JSON parse errors
    }
  }, [attemptId]);

  // Save answers to localStorage when updated
  const handleSelectOption = (questionId: number, optionId: number) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: optionId };
      try {
        localStorage.setItem(`jl_assessment_answers_${attemptId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.values(answers).filter((val) => val !== null && val !== undefined).length;
  const unansweredCount = totalQuestions - answeredCount;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payloadAnswers = questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: answers[q.id] ?? null,
      }));

      const res = await fetch("/api/student/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers: payloadAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit assessment.");
      }

      // Clear local storage
      try {
        localStorage.removeItem(`jl_assessment_answers_${attemptId}`);
      } catch (e) {}

      // Refresh server components & redirect to detailed result page
      router.refresh();
      router.push(`/assessments/${attemptId}`);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during submission.");
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-stone-600">No questions available for this assessment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <header className="surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">Diagnostic Assessment</span>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl">{assessmentTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-surface-muted px-3 py-2 text-right">
              <span className="block text-xs font-semibold text-stone-500">Progress</span>
              <span className="font-bold text-primary">
                {answeredCount} / {totalQuestions} Answered
              </span>
            </div>
            <button
              type="button"
              className="btn-primary px-4 py-2 text-sm"
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
            >
              Submit Assessment
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${Math.round(((currentIndex + 1) / totalQuestions) * 100)}%` }}
          />
        </div>
      </header>

      {errorMsg && (
        <div className="status-error" role="alert">
          {errorMsg}
        </div>
      )}

      {/* Main question workspace */}
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <article className="surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                {currentQuestion.skillName}
              </span>
              <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold capitalize text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                {currentQuestion.difficulty}
              </span>
            </div>
            <span className="text-xs font-bold text-stone-500">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
          </div>

          <div className="mt-6 text-base font-semibold leading-relaxed sm:text-lg">
            {currentQuestion.questionText}
          </div>

          {/* Options */}
          <div className="mt-6 space-y-3">
            {currentQuestion.options.map((opt) => {
              const isSelected = answers[currentQuestion.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                  className={`w-full text-left rounded-xl border p-4 text-sm font-medium transition duration-150 flex items-start gap-3.5 focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-stone-200 bg-surface hover:border-primary/50 hover:bg-surface-muted dark:border-stone-800"
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold transition ${
                      isSelected
                        ? "border-primary bg-primary text-on-primary"
                        : "border-stone-300 text-stone-500 dark:border-stone-700"
                    }`}
                  >
                    {String.fromCharCode(65 + opt.optionOrder - 1)}
                  </span>
                  <span className="mt-0.5 leading-6">{opt.optionText}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom navigation */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              className="btn-secondary px-4 py-2 text-sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
            >
              ← Previous
            </button>
            {currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                className="btn-primary px-5 py-2 text-sm"
                onClick={() => setCurrentIndex((i) => Math.min(i + 1, totalQuestions - 1))}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary px-5 py-2 text-sm"
                onClick={() => setShowConfirmModal(true)}
              >
                Review & Submit →
              </button>
            )}
          </div>
        </article>

        {/* Sidebar Question Palette */}
        <aside className="surface p-5 space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-stone-500">Question Palette</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 w-9 rounded-lg text-xs font-bold transition grid place-items-center ${
                    isCurrent
                      ? "ring-2 ring-primary ring-offset-2 bg-primary text-on-primary"
                      : isAnswered
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-surface-muted text-stone-600 hover:bg-stone-200 dark:hover:bg-stone-800"
                  }`}
                  title={`${q.skillName} - ${isAnswered ? "Answered" : "Unanswered"}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 text-xs space-y-2 text-stone-600">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary" /> Current
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary/30 border border-primary/40" /> Answered
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-surface-muted" /> Unanswered
            </div>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="surface max-w-md w-full p-6 space-y-5 shadow-2xl rounded-2xl">
            <h3 className="text-xl font-bold">Ready to Submit Assessment?</h3>
            <div className="space-y-2 text-sm text-stone-600">
              <p>
                You have answered <strong className="text-primary">{answeredCount}</strong> out of{" "}
                <strong>{totalQuestions}</strong> questions.
              </p>
              {unansweredCount > 0 && (
                <p className="rounded-xl bg-amber-50 p-3 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300">
                  ⚠️ You have {unansweredCount} unanswered {unansweredCount === 1 ? "question" : "questions"}.
                  Unanswered questions will be scored as 0 points.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                className="btn-secondary px-4 py-2 text-sm"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                Continue Test
              </button>
              <button
                type="button"
                className="btn-primary px-5 py-2 text-sm"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
