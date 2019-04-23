import { GlobalRestUrlConstants } from '../../GlobalRestUrlConstants';

export class TimeTableSettingCtrl {
  navModel: any;
  activeTabIndex = 0;
  $scope: any;
  RestUrl: any;
  departments: any;
  batches: any;
  teachers: any;
  clgObject: any;
  counter: any;
  totalLectures: any;
  colleges: any;
  branches: any;
  collegeId: any;
  branchId: any;
  sections: any;
  batchId: any;
  departmentId: any;
  isCollegeSelected: any;
  isBranchSelected: any;
  isSectionSelected: any;
  isNextSelected: any;
  semesters: any;
  semesterId: any;
  sectionId: any;
  subjects: any;
  subjectId: any;
  lectureTimings: any;
  isValid: any;
  timeTableValidationMessage: any;
  /** @ngInject */
  constructor($scope, private backendSrv) {
    this.isValid = true;
    this.RestUrl = new GlobalRestUrlConstants();
    this.counter = 0;
    this.activeTabIndex = 0;
    this.$scope = $scope;
    this.clgObject = {};
    this.lectureTimings = [];
    this.timeTableValidationMessage = "";
    this.getColleges();
    this.getSemester();
    this.isCollegeSelected = 0;
    this.isBranchSelected = 0;
    this.isSectionSelected = 0;
    this.isNextSelected = 0;
    $scope.isReadOnly = true;
    $scope.choices = [];
    $scope.idx = {};
    this.totalLectures = [];
  }

  activateTab(tabIndex) {
    this.activeTabIndex = tabIndex;
  }

  changeCounter(opt) {
    if (opt === 'plus') {
      this.counter = this.counter + 1;
    }
    if (opt === 'minus' && this.counter > 0) {
      this.counter = this.counter - 1;
    }
  }

  addRows() {
    if (this.totalLectures.length !== this.counter) {
      this.totalLectures.length = 0;
      for (let i = 0; i < this.counter; i++) {
        this.totalLectures.push({ i });
      }
    }
  }

  getSemester() {
    this.backendSrv.get(this.RestUrl.getSemesterRestUrl()).then(result => {
      this.semesters = result;
    });
  }

  getColleges() {
    this.backendSrv.get(this.RestUrl.getCollegeRestUrl()).then(result => {
      this.colleges = result;
    });
  }

  onChangeCollege() {
    this.isCollegeSelected = 0;
    if (!this.collegeId) {
      this.branches = {};
      return;
    }
    this.backendSrv.get(this.RestUrl.getBranchesByCollegeIdRestUrl() + this.collegeId).then(result => {
      this.branches = result;
    });
  }

  onChangeBranch() {
    this.isBranchSelected = 0;
    if (!this.branchId) {
      this.departments = {};
      return;
    }
    this.backendSrv.get(this.RestUrl.getDepartmentByBranchIdRestUrl() + this.branchId).then(result => {
      this.departments = result;
    });
  }

  onChangeDepartment() {
    if (!this.departmentId) {
      this.batches = {};
      return;
    }
    this.backendSrv.get(this.RestUrl.getBatchByDepartmentIdRestUrl() + this.departmentId).then(result => {
      this.batches = result;
    });
  }

  onChangeBatch() {
    if (!this.batchId) {
      this.sections = {};
      return;
    }
    this.backendSrv.get(this.RestUrl.getSectionByBatchRestUrl() + this.batchId).then(result => {
      this.sections = result;
    });
  }

  onChangeSection() {
    if (!this.sectionId) {
      this.isSectionSelected = 0;
    } else {
      this.isSectionSelected = 1;
    }
  }

  next() {
    if (this.counter <= 0) {
      alert('Please create lectures.');
    } else {
      this.isValid = this.validateTimings();
      if (!this.isValid) {
        return;
      }
      this.isSectionSelected = 0;
      this.isNextSelected = 1;
      this.$scope.isReadOnly = false;
      this.getSubjects();
      this.getTeachers();
      this.activateTab(2);
    }
  }

  validateTimings() {
    const timings = this.lectureTimings;
    let isValid = true;
    if (timings.length === 0 && this.totalLectures > 0) {
      isValid = false;
      this.timeTableValidationMessage = "Please enter start and end time.";
      return isValid;
    }
    for (let i = 0; i < timings.length; i++) {
      const time = timings[i];
      if (!time.startTime || !time.endTime) {
        isValid = false;
        this.timeTableValidationMessage = "Please enter start and end time.";
        break;
      }
      if (time.startTime && time.endTime && time.startTime.getTime() >= time.endTime.getTime()) {
        isValid = false;
        this.timeTableValidationMessage = "Please enter valid start and end time.";
        break;
      }
      const nextTime = timings[i + 1];
      if (nextTime && nextTime.startTime && time.endTime && nextTime.startTime.getTime() < time.endTime.getTime()) {
        isValid = false;
        this.timeTableValidationMessage = "Please enter valid start time of upcoming lecture.";
        break;
      }
      if (time.isBreak) {
        if (nextTime) {
          if (nextTime.startTime && time.endTime && nextTime.startTime.getTime() < (time.endTime.getTime() + (30 * 60 * 1000))) {
            isValid = false;
            this.timeTableValidationMessage = "Please add atleast 30 mins to start time after break";
            break;
          }
        }
      }
    }
    return isValid;
  }

  saveLectures() {
    const lectureTimings = this.lectureTimings;
    const payLoad = [];
    for (let i = 0; i < lectureTimings.length; i++) {
      const timings = lectureTimings[i];
      const data = payLoad[i] || [];
      const subjects = timings.subjects;
      const teachers = timings.teachers;
      const startTime = timings.startTime.toLocaleTimeString('en-US');
      const endTime = timings.endTime.toLocaleTimeString('en-US');
      let counter = 0;
      for (const j in subjects) {
        data[counter] = {
          weekDay: j,
          startTime: startTime,
          endTime: endTime,
          subjectId: subjects[j],
          teacherId: teachers[j]
        };
        counter++;
      }
      payLoad[i] = data;
    }
    this.backendSrv.post(
      `${this.RestUrl.getCmsLecturesUrl()}termId=19800&academicYear=2018&sectionId=${this.sectionId}&batchId=${this.batchId}`,
      JSON.stringify(payLoad)).then(result => {
        // this.colleges = result;
        console.log("ha ha");
      });
  }

  back() {
    this.isSectionSelected = 1;
    this.isNextSelected = 0;
    this.$scope.isReadOnly = true;
    this.activateTab(0);
  }

  getSubjects() {
    this.backendSrv
      .get(this.RestUrl.getSubjectByDeptBatchIdRestUrl() + 'deptId=' + this.departmentId + '&batchId=' + this.batchId)
      .then(result => {
        this.subjects = result;
      });
  }

  getTeachers() {
    this.backendSrv
      .get(this.RestUrl.getTeacherByQueryParamsRestUrl() + 'deptId=' + this.departmentId + '&branchId=' + this.branchId)
      .then(result => {
        this.teachers = result;
      });
  }
}
