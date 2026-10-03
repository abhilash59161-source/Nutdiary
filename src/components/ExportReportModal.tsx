/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  X, 
  FileText, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  Calendar, 
  User, 
  Stethoscope, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle,
  Copy,
  Check
} from "lucide-react";
import { FoodItem, UserProfile } from "../types.js";

interface ExportReportModalProps {
  foodLogs: FoodItem[];
  profile: UserProfile;
  selectedDate: string;
  onClose: () => void;
}

type DateRangeOption = "7days" | "14days" | "30days" | "all";

export default function ExportReportModal({
  foodLogs,
  profile,
  selectedDate,
  onClose,
}: ExportReportModalProps) {
  const [dateRange, setDateRange] = useState<DateRangeOption>("7days");
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [clinicianNotes, setClinicianNotes] = useState("");

  // Calculate dates based on range
  const getFilteredLogs = () => {
    if (dateRange === "all") return [...foodLogs].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));

    const daysCount = dateRange === "7days" ? 7 : dateRange === "14days" ? 14 : 30;
    const now = new Date(selectedDate);
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - (daysCount - 1));
    const pastDateStr = pastDate.toISOString().split("T")[0];

    return foodLogs
      .filter((log) => log.loggedAt >= pastDateStr && log.loggedAt <= selectedDate)
      .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  };

  const filteredLogs = getFilteredLogs();

  // Distinct dates in range
  const uniqueDates = Array.from(new Set(filteredLogs.map((log) => log.loggedAt)));
  const daysLoggedCount = uniqueDates.length;

  // Aggregated totals
  const totalCals = filteredLogs.reduce((sum, item) => sum + item.calories * item.servingAmount, 0);
  const totalProtein = filteredLogs.reduce((sum, item) => sum + item.protein * item.servingAmount, 0);
  const totalCarbs = filteredLogs.reduce((sum, item) => sum + item.carbs * item.servingAmount, 0);
  const totalFat = filteredLogs.reduce((sum, item) => sum + item.fat * item.servingAmount, 0);

  const avgCalories = daysLoggedCount > 0 ? Math.round(totalCals / daysLoggedCount) : 0;
  const avgProtein = daysLoggedCount > 0 ? Math.round(totalProtein / daysLoggedCount) : 0;
  const avgCarbs = daysLoggedCount > 0 ? Math.round(totalCarbs / daysLoggedCount) : 0;
  const avgFat = daysLoggedCount > 0 ? Math.round(totalFat / daysLoggedCount) : 0;

  // Adherence
  const compliantDays = uniqueDates.filter((dateStr) => {
    const dayCals = filteredLogs
      .filter((l) => l.loggedAt === dateStr)
      .reduce((sum, item) => sum + item.calories * item.servingAmount, 0);
    return dayCals >= profile.targetCalories * 0.85 && dayCals <= profile.targetCalories * 1.1;
  }).length;

  const adherenceRate = daysLoggedCount > 0 ? Math.round((compliantDays / daysLoggedCount) * 100) : 0;

  // Generate CSV data string
  const generateCsvData = () => {
    const headers = [
      "Date",
      "Meal Type",
      "Food Name",
      "Calories (kcal)",
      "Protein (g)",
      "Carbohydrates (g)",
      "Fat (g)",
      "Serving Size",
      "Servings",
      "Total Calories (kcal)"
    ];

    const rows = filteredLogs.map((log) => [
      log.loggedAt,
      log.mealType.toUpperCase(),
      `"${log.name.replace(/"/g, '""')}"`,
      log.calories,
      log.protein,
      log.carbs,
      log.fat,
      `"${log.servingSize}"`,
      log.servingAmount,
      Math.round(log.calories * log.servingAmount)
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  };

  // Download CSV
  const handleDownloadCsv = () => {
    const csvContent = generateCsvData();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NutDiary_Medical_Nutrition_Report_${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy CSV to clipboard
  const handleCopyCsv = async () => {
    try {
      await navigator.clipboard.writeText(generateCsvData());
      setCopiedCsv(true);
      setTimeout(() => setCopiedCsv(false), 2500);
    } catch (e) {
      console.error("Clipboard error:", e);
    }
  };

  // Print clinical report
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-50 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-100 shadow-2xl flex flex-col overflow-hidden max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Header (Hidden in Print) */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-5 text-white flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight leading-tight">
                Clinical Nutrition & Food Log Export
              </h3>
              <span className="text-xs text-emerald-100 font-medium block">
                Official report for physician, dietitian, and endocrinology consults
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Controls Bar (Hidden in Print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 shrink-0 print:hidden">
          {/* Range picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              Report Window:
            </span>
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
              <button
                onClick={() => setDateRange("7days")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  dateRange === "7days" ? "bg-emerald-500 text-white shadow-xs" : "hover:text-slate-900"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateRange("14days")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  dateRange === "14days" ? "bg-emerald-500 text-white shadow-xs" : "hover:text-slate-900"
                }`}
              >
                14 Days
              </button>
              <button
                onClick={() => setDateRange("30days")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  dateRange === "30days" ? "bg-emerald-500 text-white shadow-xs" : "hover:text-slate-900"
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setDateRange("all")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  dateRange === "all" ? "bg-emerald-500 text-white shadow-xs" : "hover:text-slate-900"
                }`}
              >
                All Records
              </button>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReport}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>

            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              Download CSV
            </button>

            <button
              onClick={handleCopyCsv}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Copy CSV to clipboard"
            >
              {copiedCsv ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedCsv ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT CONTAINER */}
        <div className="p-6 md:p-8 overflow-y-auto flex-grow space-y-6 print:p-0 print:overflow-visible print:space-y-6">
          
          {/* Printable Report Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1 rounded-lg bg-emerald-600 text-white text-xs font-black">
                  NutDiary
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-700">
                  Medical Nutrition & Dietary Intake Record
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Comprehensive Nutritional Adherence Report
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Generated on: {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} | Reference Date: {selectedDate}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Window Period
              </span>
              <span className="text-sm font-black text-slate-800">
                {dateRange === "all" ? "All Time Log History" : `Last ${dateRange.replace("days", "")} Days`}
              </span>
              <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">
                {daysLoggedCount} Active Tracking Days
              </span>
            </div>
          </div>

          {/* Patient Demographics & Nutritional Targets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Patient Demographics
              </span>
              <span className="text-xs font-bold text-slate-800 block mt-0.5">
                {profile.age} yrs • {profile.gender.toUpperCase()}
              </span>
              <span className="text-[11px] text-slate-500">
                {profile.height} cm • {profile.weight} kg
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Prescribed Goal
              </span>
              <span className="text-xs font-bold text-emerald-700 uppercase block mt-0.5">
                {profile.goal.replace("_", " ")}
              </span>
              <span className="text-[11px] text-slate-500">
                Activity: {profile.activityLevel}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Prescribed Target
              </span>
              <span className="text-xs font-black text-slate-900 block mt-0.5">
                {profile.targetCalories} kcal / day
              </span>
              <span className="text-[11px] text-slate-500">
                Target Deficit/Surplus Active
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Target Macronutrients
              </span>
              <span className="text-xs font-bold text-slate-800 block mt-0.5">
                P: {profile.targetProtein}g | C: {profile.targetCarbs}g
              </span>
              <span className="text-[11px] text-slate-500">
                F: {profile.targetFat}g / day
              </span>
            </div>
          </div>

          {/* Average Intake vs Targets Box */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Observed Period Intake Summary (Daily Average)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Avg Calories</span>
                <span className="text-xl font-black text-slate-900 block mt-0.5">{avgCalories}</span>
                <span className="text-[10px] text-slate-500">vs {profile.targetCalories} kcal target</span>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-indigo-500 uppercase block">Avg Protein</span>
                <span className="text-xl font-black text-slate-900 block mt-0.5">{avgProtein}g</span>
                <span className="text-[10px] text-slate-500">vs {profile.targetProtein}g target</span>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-amber-500 uppercase block">Avg Carbs</span>
                <span className="text-xl font-black text-slate-900 block mt-0.5">{avgCarbs}g</span>
                <span className="text-[10px] text-slate-500">vs {profile.targetCarbs}g target</span>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-rose-500 uppercase block">Avg Fat</span>
                <span className="text-xl font-black text-slate-900 block mt-0.5">{avgFat}g</span>
                <span className="text-[10px] text-slate-500">vs {profile.targetFat}g target</span>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Adherence Rate</span>
                <span className="text-xl font-black text-emerald-800 block mt-0.5">{adherenceRate}%</span>
                <span className="text-[10px] text-emerald-600 font-semibold">{compliantDays} of {daysLoggedCount} days on-target</span>
              </div>
            </div>
          </div>

          {/* Detailed Food Log Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Itemized Meal Logs ({filteredLogs.length} Records)
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                {uniqueDates.length} distinct days
              </span>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No meal logs found in this date window</p>
                <p className="text-xs text-slate-400 mt-1">Try switching to a wider window or "All Records".</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200 text-[10px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Meal</th>
                      <th className="py-2.5 px-3">Food Item</th>
                      <th className="py-2.5 px-3">Serving</th>
                      <th className="py-2.5 px-3 text-right">Calories</th>
                      <th className="py-2.5 px-3 text-right">Protein</th>
                      <th className="py-2.5 px-3 text-right">Carbs</th>
                      <th className="py-2.5 px-3 text-right">Fat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredLogs.map((log) => {
                      const cals = Math.round(log.calories * log.servingAmount);
                      const protein = Math.round(log.protein * log.servingAmount);
                      const carbs = Math.round(log.carbs * log.servingAmount);
                      const fat = Math.round(log.fat * log.servingAmount);

                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {log.loggedAt}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              log.mealType === "breakfast" ? "bg-amber-100 text-amber-800" :
                              log.mealType === "lunch" ? "bg-orange-100 text-orange-800" :
                              log.mealType === "dinner" ? "bg-indigo-100 text-indigo-800" :
                              "bg-emerald-100 text-emerald-800"
                            }`}>
                              {log.mealType}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 max-w-[200px] truncate">
                            {log.name}
                          </td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">
                            {log.servingAmount > 1 ? `${log.servingAmount} × ` : ""}{log.servingSize}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900">
                            {cals} kcal
                          </td>
                          <td className="py-2 px-3 text-right text-indigo-600 font-bold">
                            {protein}g
                          </td>
                          <td className="py-2 px-3 text-right text-amber-600 font-bold">
                            {carbs}g
                          </td>
                          <td className="py-2 px-3 text-right text-rose-600 font-bold">
                            {fat}g
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Clinician Notes & Medical Sign-off Section */}
          <div className="pt-4 border-t-2 border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Doctor / Nutritionist Clinical Impressions:
              </label>
              <textarea
                value={clinicianNotes}
                onChange={(e) => setClinicianNotes(e.target.value)}
                placeholder="Write clinical recommendations, lab work correlation, or adjusted macronutrient prescription here before printing..."
                className="w-full h-24 p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 print:bg-white print:border-slate-300"
              />
            </div>

            <div className="flex flex-col justify-end space-y-4 pt-4 md:pt-0">
              <div className="border-b border-slate-400 pb-1">
                <span className="text-[11px] text-slate-400 block">Attending Clinician / Dietitian Signature:</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>License / NPI Number: _________________</span>
                <span>Date: _________________</span>
              </div>
            </div>
          </div>

          {/* Legal / Medical Disclaimer */}
          <div className="text-[10px] text-slate-400 italic text-center pt-2">
            This dietary report is exported from NutDiary for informational and clinical consultation purposes. Dietary guidelines should be interpreted in conjunction with comprehensive clinical laboratory assessments.
          </div>
        </div>

        {/* Modal Footer (Hidden in print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5 shrink-0 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-white transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrintReport}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
        </div>
      </div>
    </div>
  );
}
