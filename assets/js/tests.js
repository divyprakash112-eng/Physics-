
window.NA_TESTS = [
  {id:1,date:"2026-10-21",type:"chapter",description:"Basic Maths & Calculus (Mathematical Tools)",phase:1},
  {id:2,date:"2026-10-24",type:"chapter",description:"Vectors",phase:1},
  {id:3,date:"2026-10-27",type:"chapter",description:"Units and Measurements",phase:1},
  {id:4,date:"2026-10-30",type:"chapter",description:"Motion in a Straight Line",phase:1},

  {id:5,date:"2026-11-03",type:"chapter",description:"Motion in a Plane",phase:1},
  {id:6,date:"2026-11-06",type:"chapter",description:"Laws of Motion",phase:1},
  {id:7,date:"2026-11-09",type:"chapter",description:"Work, Energy and Power",phase:1},
  {id:8,date:"2026-11-12",type:"mixed",description:"Cumulative Revision: Chapters 1–7 (Completed Chapters)",phase:1},
  {id:9,date:"2026-11-16",type:"chapter",description:"Centre of Mass and System of Particles",phase:1},
  {id:10,date:"2026-11-19",type:"chapter",description:"Rotational Motion",phase:1},
  {id:11,date:"2026-11-23",type:"chapter",description:"Gravitation",phase:1},
  {id:12,date:"2026-11-26",type:"chapter",description:"Mechanical Properties of Solids",phase:1},
  {id:13,date:"2026-11-29",type:"mixed",description:"Cumulative Revision: Chapters 1–11 (Completed Chapters)",phase:1},

  {id:14,date:"2026-12-03",type:"chapter",description:"Mechanical Properties of Fluids",phase:1},
  {id:15,date:"2026-12-07",type:"chapter",description:"Thermal Properties of Matter",phase:1},
  {id:16,date:"2026-12-10",type:"chapter",description:"Kinetic Theory",phase:1},
  {id:17,date:"2026-12-14",type:"chapter",description:"Thermodynamics",phase:1},
  {id:18,date:"2026-12-17",type:"mixed",description:"Cumulative Revision: Chapters 1–15 (Completed Chapters)",phase:1},
  {id:19,date:"2026-12-21",type:"chapter",description:"Oscillations",phase:1},
  {id:20,date:"2026-12-24",type:"chapter",description:"Waves",phase:1},
  {id:21,date:"2026-12-28",type:"chapter",description:"Electric Charges and Fields",phase:1},

  {id:22,date:"2027-01-02",type:"mixed",description:"Cumulative Revision: Chapters 1–18 (Completed Chapters)",phase:1},
  {id:23,date:"2027-01-06",type:"chapter",description:"Electrostatic Potential and Capacitance",phase:1},
  {id:24,date:"2027-01-09",type:"chapter",description:"Current Electricity",phase:1},
  {id:25,date:"2027-01-13",type:"chapter",description:"Moving Charges and Magnetism",phase:1},
  {id:26,date:"2027-01-16",type:"chapter",description:"Magnetism and Matter",phase:1},
  {id:27,date:"2027-01-20",type:"mixed",description:"Cumulative Revision: Chapters 1–22 (Completed Chapters)",phase:1},
  {id:28,date:"2027-01-23",type:"chapter",description:"Electromagnetic Induction",phase:1},
  {id:29,date:"2027-01-27",type:"chapter",description:"Alternating Current",phase:1},
  {id:30,date:"2027-01-30",type:"chapter",description:"Electromagnetic Waves",phase:1},

  {id:31,date:"2027-02-03",type:"chapter",description:"Ray Optics and Optical Instruments",phase:1},
  {id:32,date:"2027-02-06",type:"chapter",description:"Wave Optics",phase:1},
  {id:33,date:"2027-02-09",type:"chapter",description:"Dual Nature of Radiation and Matter",phase:1},
  {id:34,date:"2027-02-12",type:"mixed",description:"Cumulative Revision: Chapters 1–28 (Completed Chapters)",phase:1},
  {id:35,date:"2027-02-15",type:"chapter",description:"Atoms",phase:1},
  {id:36,date:"2027-02-18",type:"chapter",description:"Nuclei",phase:1},
  {id:37,date:"2027-02-21",type:"chapter",description:"Semiconductor Electronics: Materials, Devices and Simple Circuits",phase:1},
  {id:38,date:"2027-02-24",type:"mixed",description:"Comprehensive Practice across Chapters 1–31",phase:1},
  {id:39,date:"2027-02-26",type:"mixed",description:"Cumulative Revision & Weak-Topic High-Yield Focus",phase:1},
  {id:40,date:"2027-02-28",type:"mixed",description:"Phase 1 Final Grand Revision (All 31 Chapters Completed)",phase:1},

  {id:41,date:"2027-03-07",type:"full",description:"Full Syllabus Physics Mock 1",phase:2},
  {id:42,date:"2027-03-14",type:"full",description:"Full Syllabus Physics Mock 2",phase:2},
  {id:43,date:"2027-03-21",type:"full",description:"Full Syllabus Physics Mock 3",phase:2},
  {id:44,date:"2027-03-28",type:"full",description:"Full Syllabus Physics Mock 4",phase:2},
  {id:45,date:"2027-03-31",type:"full",description:"Full Syllabus Physics Mock 5",phase:2},

  {id:46,date:"2027-04-07",type:"full",description:"Full Syllabus Physics Mock 6",phase:2},
  {id:47,date:"2027-04-14",type:"full",description:"Full Syllabus Physics Mock 7",phase:2},
  {id:48,date:"2027-04-21",type:"full",description:"Full Syllabus Physics Mock 8",phase:2},
  {id:49,date:"2027-04-26",type:"full",description:"Full Syllabus Physics Mock 9",phase:2},
  {id:50,date:"2027-04-30",type:"full",description:"Final Full Syllabus Physics Mock",phase:2}
].map(test => ({
  ...test,
  title: `Test ${String(test.id).padStart(2,"0")}`,
  file: `tests/test-${String(test.id).padStart(2,"0")}.html`
}));

window.getTestById = function(id) {
  return window.NA_TESTS.find(test => test.id === Number(id)) || null;
};
