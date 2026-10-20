import { api, requireUser } from "@/lib/api";
import { QuestionBankView } from "@/components/question-bank/question-bank-view";

export default async function QuestionBankPage() {
  const user = await requireUser();
  const [questions, categories, hierarchy, tags, boards, years] = await Promise.all([
    api.questionBank().catch(() => []),
    api.questionBankCategories().catch(() => []),
    api.questionBankHierarchy().catch(() => []),
    api.questionBankTags().catch(() => []),
    api.questionBankBoards().catch(() => []),
    api.questionBankYears().catch(() => [])
  ]);

  return (
    <QuestionBankView
      initialQuestions={questions}
      initialCategories={categories}
      initialHierarchy={hierarchy}
      initialTags={tags}
      initialBoards={boards}
      initialYears={years}
      user={user}
    />
  );
}
