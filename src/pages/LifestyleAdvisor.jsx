import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calculator, Utensils, Dumbbell, Moon, ChevronDown, ChevronUp, X } from 'lucide-react';
import { generateTextWithCohere } from '../api/cohere';
import { generateTextWithGroq } from '../api/groq';
import { generateTextWithGemini } from '../api/gemini';
import { generateTextFallback } from '../api/cascadeRouter';

export default function LifestyleAdvisor() {
  const [form, setForm] = useState({
    age: '', height: '', weight: '', gender: '',
    activity: '', goal: '', sleepHours: '',
    dietType: '', allergies: []
  });
  const [allergyInput, setAllergyInput] = useState('');
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('diet');
  const [expandedExercise, setExpandedExercise] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addAllergy = () => {
    if (allergyInput.trim() && !form.allergies.includes(allergyInput.trim())) {
      setForm({ ...form, allergies: [...form.allergies, allergyInput.trim()] });
      setAllergyInput('');
    }
  };

  const removeAllergy = (a) => setForm({ ...form, allergies: form.allergies.filter((x) => x !== a) });

  const calcBMI = () => {
    if (!form.height || !form.weight) return null;
    const heightM = form.height / 100;
    return (form.weight / (heightM * heightM)).toFixed(1);
  };

  const bmi = calcBMI();

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { label: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-orange-600' };
    return { label: 'Obese', color: 'text-red-600' };
  };

  const analyze = async () => {
    if (!form.age || !form.height || !form.weight || !form.gender || !form.activity || !form.goal || !form.dietType) {
      setError('Please fill in all required fields including diet preference.');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const bmiVal = calcBMI();
      const allergyText = form.allergies.length > 0
        ? `Allergic to: ${form.allergies.join(', ')}`
        : 'No food allergies';

      const prompt = `You are a professional fitness and nutrition expert. Analyze this person's profile and create a comprehensive lifestyle plan.

Profile:
- Age: ${form.age} years
- Gender: ${form.gender}
- Height: ${form.height} cm
- Weight: ${form.weight} kg
- BMI: ${bmiVal}
- Activity Level: ${form.activity}
- Goal: ${form.goal}
- Diet Type: ${form.dietType}
- ${allergyText}
- Current Sleep: ${form.sleepHours || 'not specified'} hours

IMPORTANT: 
- All meal suggestions must strictly follow the ${form.dietType} diet
- If diet type is "vegetarian", NO meat, fish or eggs
- If diet type is "vegan", NO animal products at all
- If diet type is "non-vegetarian", include appropriate meat/fish
- STRICTLY avoid these allergens in ALL meal suggestions: ${form.allergies.length > 0 ? form.allergies.join(', ') : 'none'}

Return a JSON response with this exact structure:
{
  "category": "Healthy or Gym or Athlete or Underweight or Overweight",
  "diet_preference": "${form.dietType}",
  "allergies_noted": ${JSON.stringify(form.allergies)},
  "maintenance_calories": 2000,
  "target_calories": 1800,
  "calorie_strategy": "deficit or surplus or maintain",
  "macros": {
    "protein_g": 150,
    "carbs_g": 200,
    "fats_g": 60,
    "protein_percent": 30,
    "carbs_percent": 40,
    "fats_percent": 30
  },
  "diet_plan": {
    "breakfast": ["food item 1", "food item 2"],
    "lunch": ["food item 1", "food item 2"],
    "dinner": ["food item 1", "food item 2"],
    "snacks": ["snack 1", "snack 2"],
    "foods_to_avoid": ["food 1", "food 2"],
    "hydration": "water intake recommendation"
  },
  "exercise_plan": {
    "cardio": {
      "exercises": ["exercise 1", "exercise 2"],
      "duration": "30 mins",
      "frequency": "3x per week",
      "tips": "tip here"
    },
    "strength": {
      "exercises": ["exercise 1", "exercise 2"],
      "duration": "45 mins",
      "frequency": "4x per week",
      "tips": "tip here"
    },
    "flexibility": {
      "exercises": ["yoga pose 1", "stretch 1"],
      "duration": "20 mins",
      "frequency": "daily",
      "tips": "tip here"
    },
    "weekly_schedule": ["Monday: Cardio", "Tuesday: Strength", "Wednesday: Rest", "Thursday: Strength", "Friday: Cardio", "Saturday: Flexibility", "Sunday: Rest"]
  },
  "sleep_plan": {
    "recommended_hours": 8,
    "bedtime": "10:30 PM",
    "wake_time": "6:30 AM",
    "tips": ["tip 1", "tip 2"],
    "recovery_tips": ["tip 1", "tip 2"]
  },
  "summary": "overall summary and motivation message"
}
Return only valid JSON, no extra text.`;

      const response = await generateTextFallback([
        { name: 'Cohere', fn: generateTextWithCohere, apiKey: import.meta.env.VITE_COHERE_API_KEY_3 },
        { name: 'Groq', fn: generateTextWithGroq, apiKey: import.meta.env.VITE_GROQ_API_KEY_3 },
        { name: 'Gemini', fn: generateTextWithGemini, apiKey: import.meta.env.VITE_GEMINI_API_KEY_3 }
      ], prompt);
      const cleaned = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);
    } catch (err) {
      setError('Failed to generate plan. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs = [
    { id: 'diet', label: 'Diet Plan', icon: Utensils },
    { id: 'exercise', label: 'Exercise', icon: Dumbbell },
    { id: 'sleep', label: 'Sleep', icon: Moon },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto py-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mb-4">
          <Heart className="w-4 h-4" />
          AI Lifestyle Advisor
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Your Personal <span className="text-teal-600">Health Plan</span>
        </h2>
        <p className="text-gray-600">Get a customized diet, exercise, and sleep plan based on your profile</p>
      </div>

      {/* Form */}
      <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-teal-500" /> Your Profile
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
            <input name="age" type="number" value={form.age} onChange={handleChange}
              placeholder="e.g. 25" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm) *</label>
            <input name="height" type="number" value={form.height} onChange={handleChange}
              placeholder="e.g. 170" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) *</label>
            <input name="weight" type="number" value={form.weight} onChange={handleChange}
              placeholder="e.g. 70" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
            <select name="gender" value={form.gender} onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level *</label>
            <select name="activity" value={form.activity} onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm">
              <option value="">Select</option>
              <option value="sedentary">Sedentary (desk job)</option>
              <option value="light">Lightly Active (1-3x/week)</option>
              <option value="moderate">Moderately Active (3-5x/week)</option>
              <option value="very active">Very Active (6-7x/week)</option>
              <option value="athlete">Athlete (2x/day)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal *</label>
            <select name="goal" value={form.goal} onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm">
              <option value="">Select</option>
              <option value="lose weight">Lose Weight</option>
              <option value="maintain weight">Maintain Weight</option>
              <option value="gain muscle">Gain Muscle</option>
              <option value="improve fitness">Improve Fitness</option>
              <option value="athletic performance">Athletic Performance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sleep Hours</label>
            <input name="sleepHours" type="number" value={form.sleepHours} onChange={handleChange}
              placeholder="e.g. 7" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Diet Preference *</label>
            <select name="dietType" value={form.dietType} onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm">
              <option value="">Select diet type</option>
              <option value="vegetarian">🥗 Vegetarian (no meat/fish)</option>
              <option value="non-vegetarian">🍗 Non-Vegetarian</option>
              <option value="vegan">🌱 Vegan (no animal products)</option>
              <option value="eggetarian">🥚 Eggetarian (veg + eggs)</option>
            </select>
          </div>
        </div>

        {/* Allergy Section */}
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 space-y-3">
          <label className="block text-sm font-medium text-orange-800">
            🚨 Food Allergies (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
              placeholder="e.g. peanuts, dairy, gluten..."
              className="flex-1 px-4 py-2 rounded-xl border border-orange-200 focus:outline-none focus:border-orange-400 text-sm bg-white"
            />
            <button onClick={addAllergy}
              className="px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm">
              + Add
            </button>
          </div>
          {form.allergies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.allergies.map((a) => (
                <span key={a} className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm border border-orange-200">
                  ⚠️ {a}
                  <button onClick={() => removeAllergy(a)}>
                    <X className="w-3 h-3 hover:text-red-500" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* BMI Preview */}
        {bmi && (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-600">Your BMI</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">{bmi}</span>
              <span className={`ml-2 text-sm font-medium ${getBMICategory(bmi).color}`}>
                {getBMICategory(bmi).label}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <button onClick={analyze} disabled={isAnalyzing}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {isAnalyzing ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating Your Plan...</>
          ) : (
            <><Heart className="w-4 h-4" /> Generate My Health Plan</>
          )}
        </button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Summary Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-teal-100 text-sm">Your Category</p>
                  <p className="text-2xl font-bold">{result.category}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white capitalize">
                      {result.diet_preference}
                    </span>
                    {result.allergies_noted?.map((a, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-orange-400/50 text-white">
                        ⚠️ No {a}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-teal-100 text-sm">Daily Target</p>
                  <p className="text-2xl font-bold">{result.target_calories} kcal</p>
                  <p className="text-teal-100 text-xs">Maintenance: {result.maintenance_calories} kcal</p>
                </div>
              </div>
              <p className="text-teal-50 text-sm">{result.summary}</p>
            </div>

            {/* Macros */}
            {result.macros && (
              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Daily Macros</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Protein', g: result.macros.protein_g, pct: result.macros.protein_percent, color: 'bg-blue-500' },
                    { label: 'Carbs', g: result.macros.carbs_g, pct: result.macros.carbs_percent, color: 'bg-orange-500' },
                    { label: 'Fats', g: result.macros.fats_g, pct: result.macros.fats_percent, color: 'bg-yellow-500' },
                  ].map((m) => (
                    <div key={m.label} className="text-center p-4 rounded-xl bg-gray-50">
                      <p className="text-sm text-gray-500">{m.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{m.g}g</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className={`${m.color} h-2 rounded-full`} style={{ width: `${m.pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{m.pct}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {/* Diet Tab */}
            {activeTab === 'diet' && result.diet_plan && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { label: '🌅 Breakfast', items: result.diet_plan.breakfast },
                    { label: '☀️ Lunch', items: result.diet_plan.lunch },
                    { label: '🌙 Dinner', items: result.diet_plan.dinner },
                    { label: '🍎 Snacks', items: result.diet_plan.snacks },
                  ].map((meal) => (
                    <div key={meal.label} className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                      <p className="font-medium text-gray-900 mb-2">{meal.label}</p>
                      <ul className="space-y-1">
                        {meal.items?.map((item, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />{item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                  <p className="font-medium text-red-800 mb-2">❌ Foods to Avoid</p>
                  <div className="flex flex-wrap gap-2">
                    {result.diet_plan.foods_to_avoid?.map((f, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">{f}</span>
                    ))}
                  </div>
                </div>
                {result.diet_plan.hydration && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-sm text-blue-800">💧 <strong>Hydration:</strong> {result.diet_plan.hydration}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Exercise Tab */}
            {activeTab === 'exercise' && result.exercise_plan && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {[
                  { key: 'cardio', label: '🏃 Cardio', data: result.exercise_plan.cardio },
                  { key: 'strength', label: '💪 Strength Training', data: result.exercise_plan.strength },
                  { key: 'flexibility', label: '🧘 Flexibility & Yoga', data: result.exercise_plan.flexibility },
                ].map((section) => (
                  <div key={section.key} className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                    <button onClick={() => setExpandedExercise(expandedExercise === section.key ? null : section.key)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-900">{section.label}</span>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{section.data?.frequency}</span>
                        <span>{section.data?.duration}</span>
                        {expandedExercise === section.key ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>
                    {expandedExercise === section.key && (
                      <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {section.data?.exercises?.map((ex, i) => (
                            <div key={i} className="text-sm text-gray-700 p-2 rounded-lg bg-teal-50 border border-teal-100 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />{ex}
                            </div>
                          ))}
                        </div>
                        {section.data?.tips && (
                          <p className="text-sm text-gray-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                            💡 {section.data.tips}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {result.exercise_plan.weekly_schedule && (
                  <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <p className="font-medium text-gray-900 mb-3">📅 Weekly Schedule</p>
                    <div className="space-y-2">
                      {result.exercise_plan.weekly_schedule.map((day, i) => (
                        <div key={i} className="text-sm text-gray-700 flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />{day}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Sleep Tab */}
            {activeTab === 'sleep' && result.sleep_plan && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Recommended Sleep', value: `${result.sleep_plan.recommended_hours}h`, icon: '😴' },
                    { label: 'Bedtime', value: result.sleep_plan.bedtime, icon: '🌙' },
                    { label: 'Wake Time', value: result.sleep_plan.wake_time, icon: '🌅' },
                  ].map((item) => (
                    <div key={item.label} className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm text-center">
                      <p className="text-2xl mb-1">{item.icon}</p>
                      <p className="text-lg font-bold text-gray-900">{item.value}</p>
                      <p className="text-xs text-gray-500">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                  <p className="font-medium text-indigo-900 mb-2">💤 Sleep Tips</p>
                  <ul className="space-y-1">
                    {result.sleep_plan.tips?.map((t, i) => (
                      <li key={i} className="text-sm text-indigo-800 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <p className="font-medium text-purple-900 mb-2">🔄 Recovery Tips</p>
                  <ul className="space-y-1">
                    {result.sleep_plan.recovery_tips?.map((t, i) => (
                      <li key={i} className="text-sm text-purple-800 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}