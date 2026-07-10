import { QuestionBankRegistry, getBankByCategory } from '../data/questionBankRegistry';

export const QuestionBankStatus = {
  IDLE: 'QUESTION_BANK_IDLE',
  LOADING: 'QUESTION_BANK_LOADING',
  READY: 'QUESTION_BANK_READY',
  EMPTY: 'QUESTION_BANK_EMPTY',
  FAILED: 'QUESTION_BANK_FAILED'
};

export async function loadQuestionBanks(categories, mandatoryCategories = []) {
  const resultState = {
    status: QuestionBankStatus.LOADING,
    startedAt: Date.now(),
    completedAt: null,
    error: null,
    loadedBanks: [],
    failedBanks: [],
    pools: {}
  };

  const loadPromises = categories.map(async (category) => {
    const bank = getBankByCategory(category);
    if (!bank) {
      resultState.failedBanks.push({ bank: category, reason: 'NOT_FOUND' });
      if (mandatoryCategories.includes(category)) {
        throw new Error(`Mandatory bank not found: ${category}`);
      }
      return;
    }

    try {
      // Dynamic import wrapped with an 8-second timeout safety watchdog
      const importPromise = bank.loader();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout loading bank: ${bank.id}`)), 8000)
      );
      
      const module = await Promise.race([importPromise, timeoutPromise]);
      resultState.pools[category] = module.default;
      resultState.loadedBanks.push(bank.id);
    } catch (err) {
      console.error(`Failed to load question bank ${bank.id}:`, err);
      resultState.failedBanks.push({ bank: bank.id, reason: err.message || 'IMPORT_FAILED' });
      if (mandatoryCategories.includes(category)) {
        throw new Error(`Mandatory bank load failed: ${bank.id}. Error: ${err.message}`);
      }
    }
  });

  // Use Promise.allSettled to ensure that one failure doesn't block the rest
  const loadResults = await Promise.allSettled(loadPromises);

  // Check if any mandatory bank failed in the settled list
  const rejectedMandatory = loadResults.some((res, idx) => {
    return res.status === 'rejected' && mandatoryCategories.includes(categories[idx]);
  });

  resultState.completedAt = Date.now();

  const loadedCount = Object.keys(resultState.pools).length;
  if (rejectedMandatory || (loadedCount === 0 && categories.length > 0)) {
    resultState.status = QuestionBankStatus.FAILED;
    resultState.error = 'All requested question banks failed to load.';
  } else if (loadedCount === 0) {
    resultState.status = QuestionBankStatus.EMPTY;
  } else {
    resultState.status = QuestionBankStatus.READY;
  }

  return resultState;
}
