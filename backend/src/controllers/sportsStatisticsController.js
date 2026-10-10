import SportsApplication from "../models/SportsApplication.js";
import SportsMeet from "../models/SportsMeet.js";
import Event from "../models/Event.js";
import Institution from "../models/Institution.js";
import sendError from "../utils/sendError.js";

export const getPublicSportsStatistics = async (req, res) => {
  try {
    /*
    =====================================================
    FIND ACTIVE MEET
    =====================================================
    */

    const now = new Date();

    const meet =
      await SportsMeet.findOne({
        isActive: true,
        status: {
          $in: [
            "applications_open",
            "applications_closed",
            "ongoing",
          ],
        },
        startDate: {
          $lte: new Date(
            now.getTime() +
              365 * 24 * 60 * 60 * 1000
          ),
        },
      })
        .sort({
          year: -1,
          startDate: -1,
        })
        .lean();

    if (!meet) {
      return res.json({
        success: true,

        data: {
          meet: null,

          statistics: {
            participants: 0,
            institutions: 0,
            events: 0,
            eventEntries: 0,
          },

          // NEW
          departmentStatistics: [],

          // EXISTING
          institutes: [],

          // EXISTING
          eventStatistics: [],
        },
      });
    }

    /*
    =====================================================
    GET EVENTS
    =====================================================
    */

    const events =
      await Event.find({
        meet: meet._id,
        isActive: true,
      })
        .sort({
          displayOrder: 1,
          name: 1,
        })
        .lean();

    /*
    =====================================================
    GET APPLICATIONS
    =====================================================
    */

    const applications =
      await SportsApplication.find({
        meet: meet._id,
        status: {
          $ne: "rejected",
        },
      })
        // Only what the counts need. No personal details.
        .select(
          "collegeCode branch semester gender participationCategory selectedEvents"
        )
        .lean();

    /*
    =====================================================
    BASIC STATISTICS
    =====================================================
    */

    const participants =
      applications.length;

    const institutionCodes =
      [
        ...new Set(
          applications
            .map(
              (application) =>
                application.collegeCode
            )
            .filter(Boolean)
        ),
      ];

    const institutions =
      institutionCodes.length;

    const eventEntries =
      applications.reduce(
        (total, application) =>
          total +
          (
            application.selectedEvents ||
            []
          ).length,
        0
      );

    /*
    =====================================================
    EVENT LOOKUP
    =====================================================
    */

    const eventMap = new Map();

    events.forEach((event) => {
      eventMap.set(
        String(event._id),
        event
      );
    });

    /*
    =====================================================
    1. DEPARTMENT + SEMESTER WISE
       EVENT PARTICIPATION
    =====================================================
    */

    const departmentSemesterMap =
      new Map();

    applications.forEach(
      (application) => {
        const department =
          application.branch?.trim();

        const semester =
          Number(application.semester);

        /*
        Ignore applications where
        department or semester is missing.
        */

        if (
          !department ||
          !semester
        ) {
          return;
        }

        const key =
          `${department}__${semester}`;

        if (
          !departmentSemesterMap.has(
            key
          )
        ) {
          departmentSemesterMap.set(
            key,
            {
              department,
              semester,
              participants: 0,
              events: {},
            }
          );
        }

        const departmentSemester =
          departmentSemesterMap.get(
            key
          );

        /*
        PARTICIPANT COUNT
        */

        departmentSemester.participants +=
          1;

        /*
        EVENT COUNTS
        */

        const selectedEvents =
          application.selectedEvents ||
          [];

        selectedEvents.forEach(
          (eventId) => {
            const id =
              String(eventId);

            departmentSemester.events[
              id
            ] =
              (
                departmentSemester.events[
                  id
                ] || 0
              ) + 1;
          }
        );
      }
    );

    const departmentStatistics =
      Array.from(
        departmentSemesterMap.values()
      )
        .map((item) => ({
          department:
            item.department,

          semester:
            item.semester,

          participants:
            item.participants,

          events:
            item.events,
        }))
        .sort((a, b) => {
          const departmentCompare =
            a.department.localeCompare(
              b.department
            );

          if (
            departmentCompare !== 0
          ) {
            return departmentCompare;
          }

          return (
            a.semester -
            b.semester
          );
        });

    /*
    =====================================================
    2. EXISTING
       INSTITUTE-WISE PARTICIPATION
    =====================================================
    */

    const instituteMap = new Map();

    applications.forEach(
      (application) => {
        const code =
          application.collegeCode ||
          "UNKNOWN";

        if (
          !instituteMap.has(code)
        ) {
          instituteMap.set(code, {
            code,
            name: code,
            participants: 0,
            male: 0,
            female: 0,
            other: 0,
            regular: 0,
            physicallyChallenged: 0,
            eventEntries: 0,
            events: {},
          });
        }

        const institute =
          instituteMap.get(code);

        institute.participants += 1;

        if (
          application.gender ===
          "male"
        ) {
          institute.male += 1;
        }

        if (
          application.gender ===
          "female"
        ) {
          institute.female += 1;
        }

        if (
          application.gender ===
          "other"
        ) {
          institute.other += 1;
        }

        if (
          application.participationCategory ===
          "physically_challenged"
        ) {
          institute.physicallyChallenged +=
            1;
        } else {
          institute.regular += 1;
        }

        const selectedEvents =
          application.selectedEvents ||
          [];

        institute.eventEntries +=
          selectedEvents.length;

        selectedEvents.forEach(
          (eventId) => {
            const id =
              String(eventId);

            institute.events[id] =
              (
                institute.events[id] ||
                0
              ) + 1;
          }
        );
      }
    );

    /*
    =====================================================
    GET INSTITUTION NAMES
    =====================================================
    */

    const institutionDocuments =
      await Institution.find({
        code: {
          $in: institutionCodes,
        },
      })
        .select(
          "code name shortName"
        )
        .lean();

    const institutionNameMap =
      new Map();

    institutionDocuments.forEach(
      (institution) => {
        institutionNameMap.set(
          institution.code,
          institution.name
        );
      }
    );

    /*
    =====================================================
    FINAL INSTITUTE DATA
    =====================================================
    */

    const instituteStatistics =
      Array.from(
        instituteMap.values()
      )
        .map((institute) => ({
          ...institute,

          name:
            institutionNameMap.get(
              institute.code
            ) ||
            institute.name,
        }))
        .sort((a, b) =>
          a.name.localeCompare(
            b.name
          )
        );

    /*
    =====================================================
    3. EXISTING
       EVENT-WISE STATISTICS
    =====================================================
    */

    const eventStatistics =
      events.map((event) => {
        let total = 0;
        let male = 0;
        let female = 0;
        let regular = 0;
        let physicallyChallenged = 0;

        applications.forEach(
          (application) => {
            const selected =
              (
                application.selectedEvents ||
                []
              ).some(
                (eventId) =>
                  String(eventId) ===
                  String(event._id)
              );

            if (!selected) {
              return;
            }

            total += 1;

            if (
              application.gender ===
              "male"
            ) {
              male += 1;
            }

            if (
              application.gender ===
              "female"
            ) {
              female += 1;
            }

            if (
              application.participationCategory ===
              "physically_challenged"
            ) {
              physicallyChallenged +=
                1;
            } else {
              regular += 1;
            }
          }
        );

        return {
          _id: event._id,
          code: event.code,
          name: event.name,
          category: event.category,
          gender: event.gender,

          participationCategory:
            event.participationCategory,

          eventType:
            event.eventType,

          total,
          male,
          female,
          regular,
          physicallyChallenged,
        };
      });

    /*
    =====================================================
    RESPONSE
    =====================================================
    */

    return res.json({
      success: true,

      data: {
        meet: {
          _id: meet._id,
          name: meet.name,
          shortName: meet.shortName,
          year: meet.year,
          startDate: meet.startDate,
          endDate: meet.endDate,
          venue: meet.venue,
          status: meet.status,
        },

        statistics: {
          participants,
          institutions,
          events: events.length,
          eventEntries,
        },

        /*
        NEW FIRST TABLE DATA
        */

        departmentStatistics,

        /*
        EXISTING SECOND TABLE DATA
        */

        institutes:
          instituteStatistics,

        /*
        EXISTING THIRD TABLE DATA
        */

        eventStatistics,
      },
    });
  } catch (error) {
    console.error(
      "PUBLIC SPORTS STATISTICS ERROR:",
      error
    );

    return sendError(res, error, "Unable to load Sports Meet statistics.");
  }
};