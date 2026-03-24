import Time "mo:core/Time";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Nat64 "mo:core/Nat64";

actor {
  type CalibrationProfile = {
    typingSpeedBaseline : Nat32;
    mouseMovementBaseline : Float;
    calibrationAccuracy : Float;
    lastUpdated : Nat64;
  };

  type SessionSnapshot = {
    timestamp : Nat64;
    focusScore : Nat;
    fatigueScore : Nat;
    stressScore : Nat;
  };

  module SessionSnapshot {
    public func compareByTimestamp(snapshot1 : SessionSnapshot, snapshot2 : SessionSnapshot) : Order.Order {
      Nat64.compare(snapshot1.timestamp, snapshot2.timestamp);
    };
  };

  type Alert = {
    timestamp : Nat64;
    alertType : Text;
    message : Text;
    severity : Nat;
  };

  module Alert {
    public func compareByTimestamp(alert1 : Alert, alert2 : Alert) : Order.Order {
      Nat64.compare(alert1.timestamp, alert2.timestamp);
    };
  };

  type UserData = {
    calibrationProfile : ?CalibrationProfile;
    sessionSnapshots : List.List<SessionSnapshot>;
    alerts : List.List<Alert>;
  };

  let usersData = Map.empty<Principal, UserData>();

  func getUserDataInternal(caller : Principal) : UserData {
    switch (usersData.get(caller)) {
      case (null) { Runtime.trap("User data not found") };
      case (?data) { data };
    };
  };

  public shared ({ caller }) func saveCalibrationProfile(typingSpeed : Nat32, mouseMovement : Float, accuracy : Float) : async () {
    let newProfile : CalibrationProfile = {
      typingSpeedBaseline = typingSpeed;
      mouseMovementBaseline = mouseMovement;
      calibrationAccuracy = accuracy;
      lastUpdated = Nat64.fromIntWrap(Time.now());
    };

    let existingData = switch (usersData.get(caller)) {
      case (null) { { sessionSnapshots = List.empty<SessionSnapshot>(); alerts = List.empty<Alert>(); calibrationProfile = null } };
      case (?data) { data };
    };

    let updatedData = {
      calibrationProfile = ?newProfile;
      sessionSnapshots = existingData.sessionSnapshots;
      alerts = existingData.alerts;
    };

    usersData.add(caller, updatedData);
  };

  public query ({ caller }) func getCalibrationProfile() : async ?CalibrationProfile {
    let userData = switch (usersData.get(caller)) {
      case (null) { return null };
      case (?data) { data };
    };
    userData.calibrationProfile;
  };

  public shared ({ caller }) func recordSessionSnapshot(focus : Nat, fatigue : Nat, stress : Nat) : async () {
    let newSnapshot : SessionSnapshot = {
      timestamp = Nat64.fromIntWrap(Time.now());
      focusScore = focus;
      fatigueScore = fatigue;
      stressScore = stress;
    };

    let existingData = switch (usersData.get(caller)) {
      case (null) { { calibrationProfile = null; alerts = List.empty<Alert>(); sessionSnapshots = List.empty<SessionSnapshot>() } };
      case (?data) { data };
    };

    existingData.sessionSnapshots.add(newSnapshot);

    let updatedData = {
      calibrationProfile = existingData.calibrationProfile;
      sessionSnapshots = existingData.sessionSnapshots;
      alerts = existingData.alerts;
    };

    usersData.add(caller, updatedData);
  };

  public shared ({ caller }) func addAlert(alertType : Text, message : Text, severity : Nat) : async () {
    let newAlert : Alert = {
      timestamp = Nat64.fromIntWrap(Time.now());
      alertType;
      message;
      severity;
    };

    let existingData = switch (usersData.get(caller)) {
      case (null) { { calibrationProfile = null; sessionSnapshots = List.empty<SessionSnapshot>(); alerts = List.empty<Alert>() } };
      case (?data) { data };
    };

    existingData.alerts.add(newAlert);

    let updatedData = {
      calibrationProfile = existingData.calibrationProfile;
      sessionSnapshots = existingData.sessionSnapshots;
      alerts = existingData.alerts;
    };

    usersData.add(caller, updatedData);
  };

  public query ({ caller }) func getSessionHistory() : async [SessionSnapshot] {
    switch (usersData.get(caller)) {
      case (null) { [] };
      case (?data) {
        data.sessionSnapshots.values().take(100).toArray().sort(SessionSnapshot.compareByTimestamp);
      };
    };
  };

  public query ({ caller }) func getAlerts() : async [Alert] {
    switch (usersData.get(caller)) {
      case (null) { [] };
      case (?data) {
        data.alerts.values().take(20).toArray().sort(Alert.compareByTimestamp);
      };
    };
  };

  public shared ({ caller }) func clearUserData() : async () {
    let emptyData : UserData = {
      calibrationProfile = null;
      sessionSnapshots = List.empty<SessionSnapshot>();
      alerts = List.empty<Alert>();
    };
    usersData.add(caller, emptyData);
  };
};
