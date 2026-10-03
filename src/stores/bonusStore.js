import { defineStore } from "pinia";
import { supabase } from "../boot/supabase";
import { useStoreAuth } from "./storeAuth";

export const useBonusStore = defineStore("bonusStore", {
  state: () => ({
    bonuses: [],
    todayPaidBonuses: [],
    todayPaymentsSubscription: null,
    paidPaymentsDateRange: { startDate: null, endDate: null },
    bonusQuery: { startDate: null, endDate: null, distributorID: null, selectedDpc: null },
    departmentType: 'my-department',  // Default selection
    bonusData: [],
    mostRecentBonus: null,
    searchQuery:null,
    loading: false,
    subscription: null,
    dpcNames: [], // Holds column names
    Dpcs:[],
    distributors: [],
    dpcDistributors: [],    // Stores distributors by selectedDPC
    selectedDistributor: [], // This will store the clicked distributor
   selectedDPCs:[], // Stores fetched DPCs for user's department
    aggregateBonus:[], // Stores formatted bonus data
    pivotBonusData:[],
    selectedDPC :null, // Store selected DPC
    takenBy:null
  }),

  actions: {
  
    async fetchDistributors1() {
      this.loading = true;
      
      try {
        let query = supabase
          .from("Distributors")
          .select("DistributorIDNO, DistributorNames, DistributorPosition, RegisteredDPC")
          .order("DistributorNames", { ascending: true });

        if (this.searchQuery) {
          query = query.ilike("DistributorNames", `%${this.searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching distributors:", error);
          this.loading = false;
          return;
        }

        this.distributors = data || [];
        console.log("Fetched Distributors:", this.distributors);
      } catch (error) {
        console.error("Unexpected error fetching distributors:", error);
      } finally {
        this.loading = false;
      }
    },

     // Fetch distributors by name in real-time
     async fetchDistributors(searchQuery) {
      this.loading = true;
      try {
        let query = supabase
          .from("Distributors")
          .select("DistributorIDNO, DistributorNames, DistributorPosition,DistributorTelephone1, RegisteredDPC")
          .order("DistributorNames", { ascending: true });

        if (searchQuery) {
          query = query.ilike("DistributorNames", `%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching distributors:", error);
          return;
        }

        this.distributors = data || [];
      } catch (error) {
        console.error("Unexpected error fetching distributors:", error);
      } finally {
        this.loading = false;
      }
    },

  // Fetch all distributors based on selected DPC
  async fetchAllDistributors2() {
    this.loading = true;

    try {
      let query = supabase
        .from("Distributors")
        .select("DistributorIDNO, DistributorNames, DistributorPosition, RegisteredDPC")
        .order("DistributorNames", { ascending: true });

      if (this.selectedDPC) {
        query = query.eq("RegisteredDPC", this.selectedDPC);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching distributors by DPC:", error);
        return;
      }

      this.dpcDistributors = data || [];
    } catch (error) {
      console.error("Unexpected error fetching distributors by DPC:", error);
    } finally {
      this.loading = false;
    }
  },
 // Fetch all distributors based on selected DPC
 async fetchAllDistributors1(query = '') {
  this.loading = true;

  try {
    let queryBuilder = supabase
      .from("Distributors")
      .select("DistributorIDNO, DistributorNames, DistributorPosition, RegisteredDPC")
      .order("DistributorNames", { ascending: true });

    // If a DPC is selected, filter by DPC
    if (this.selectedDPC) {
      queryBuilder = queryBuilder.eq("RegisteredDPC", this.selectedDPC);
    }

    // If a search query is provided, filter by Distributor Names
    if (query) {
      queryBuilder = queryBuilder.ilike("DistributorNames", `%${query}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("Error fetching distributors:", error);
      return;
    }

    this.dpcDistributors = data || [];
  } catch (error) {
    console.error("Unexpected error fetching distributors:", error);
  } finally {
    this.loading = false;
  }
},
 
  // Fetch all distributors based on selected DPC
  async fetchAllDistributors() {
    this.loading = true;

    try {
      let query = supabase
        .from("Distributors")
        .select("DistributorIDNO, DistributorNames, DistributorPosition,DistributorTelephone1, RegisteredDPC")
        .order("DistributorNames", { ascending: true });

      if (this.selectedDPC) {
        query = query.eq("RegisteredDPC", this.selectedDPC);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching distributors by DPC:", error);
        return;
      }

      this.dpcDistributors = data || [];
    } catch (error) {
      console.error("Unexpected error fetching distributors by DPC:", error);
    } finally {
      this.loading = false;
    }
  },

  async updateDPC(distributor) {
    try {
      const { error } = await supabase
        .from("Distributors")
        .update({ RegisteredDPC: distributor.RegisteredDPC })
        .eq("DistributorIDNO", distributor.DistributorIDNO);

      if (error) throw error;

      // Refresh the list after updating
      await this.fetchAllDistributors1();

      return { success: true };
    } catch (error) {
      console.error("Error updating DPC:", error);
      return { success: false, message: error.message };
    }
  },


    


    
    async fetchBonuses(startDate, endDate, DistributorIDNO, selectedDpc) {
      this.loading = true;
      this.bonuses = []; // Ensure bonuses are empty at the start
      const now = new Date();
      const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const firstDay = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
      const lastDay = formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      const formattedStartDate = startDate || firstDay;
      const formattedEndDate = endDate || lastDay;
      this.bonusQuery = {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        distributorID: DistributorIDNO || null,
        selectedDpc: selectedDpc || null,
      };
    
      //console.log("Fetching bonuses for DistributorIDNO:", DistributorIDNO, "between:", formattedStartDate, "and", formattedEndDate); // Debugging log
    
      try {
        const bonuses = [];
        const pageSize = 1000;
        let offset = 0;

        while (true) {
          let query = supabase
            .from("Bonus")
            .select("*")
            .gte("BonusDate", formattedStartDate)
            .lte("BonusDate", formattedEndDate)
            .order("BonusDate", { ascending: false })
            .range(offset, offset + pageSize - 1);

          if (DistributorIDNO) {
            query = query.eq("DistributorIDNO", DistributorIDNO);
          }

          const { data, error: bonusError } = await query;
          if (bonusError) throw bonusError;
          bonuses.push(...(data || []));
          if (!data || data.length < pageSize) break;
          offset += pageSize;
        }
    
        //console.log("Fetched bonuses:", bonuses); // Debugging log
    
        if (!bonuses.length) {
          this.bonuses = []; // No bonuses found
          this.mostRecentBonus = null;
          this.loading = false;
          return;
        }
    
        // Extract unique DistributorIDNOs from bonuses
        const distributorIDs = [...new Set(bonuses.map(bonus => bonus.DistributorIDNO).filter(Boolean))];
        const distributors = [];
        for (let index = 0; index < distributorIDs.length; index += 200) {
          const { data, error: distributorError } = await supabase
            .from("Distributors")
            .select("DistributorIDNO, DistributorNames, DistributorPosition, RegisteredDPC")
            .in("DistributorIDNO", distributorIDs.slice(index, index + 200));

          if (distributorError) throw distributorError;
          distributors.push(...(data || []));
        }
    
        // Create a map for fast lookup
        const distributorMap = Object.fromEntries(distributors.map(d => [d.DistributorIDNO, d]));
    
        // Merge distributor details into bonuses
        let filteredBonuses = bonuses.map(bonus => ({
          ...bonus,
          DistributorName: distributorMap[bonus.DistributorIDNO]?.DistributorNames || "Unknown",
          DistributorPosition: distributorMap[bonus.DistributorIDNO]?.DistributorPosition || "Unknown",
          RegisteredDPC: distributorMap[bonus.DistributorIDNO]?.RegisteredDPC || null,
        }));
    
        // If selectedDpc is provided, filter bonuses by RegisteredDPC
        if (selectedDpc) {
          filteredBonuses = filteredBonuses.filter(bonus => bonus.RegisteredDPC === selectedDpc);
        }
    
        // Order bonuses by DistributorName in ascending order (optional)
        this.bonuses = filteredBonuses.sort((a, b) => a.DistributorName.localeCompare(b.DistributorName));
    
        this.mostRecentBonus = this.bonuses.length ? this.bonuses[0] : null;
        this.loading = false;
    
        // ✅ Log the structured bonuses in the console
        console.log("Final fetched bonuses:", JSON.stringify(this.bonuses, null, 2));
    
      } catch (error) {
        console.error("Error fetching data:", error);
        this.loading = false;
      }
    },
    

  

    async fetchBonusesWithDPCSummary(startDate, endDate) {
      this.loading = true;
    
      try {
        // Format start and end dates
        const formattedStartDate = startDate
          ? new Date(startDate).toISOString().split("T")[0]
          : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    
        const formattedEndDate = endDate
          ? new Date(endDate).toISOString().split("T")[0]
          : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0];
    
        // Fetch bonuses within the date range
        const { data: bonuses, error: bonusError } = await supabase
          .from("Bonus")
          .select("DistributorIDNO, BonusValue, Status, BonusDate")
          .gte("BonusDate", formattedStartDate)
          .lte("BonusDate", formattedEndDate);
    
        if (bonusError) {
          console.error("Error fetching bonuses:", bonusError);
          this.loading = false;
          return;
        }
    
        if (!bonuses || bonuses.length === 0) {
          this.bonuses = [];
          this.dpcSummary = [];
          this.loading = false;
          return;
        }
    
        // Extract unique DistributorIDNOs
        const distributorIDs = [...new Set(bonuses.map(b => b.DistributorIDNO))];
    
        // Fetch Distributor details (RegisteredDPC)
        const { data: distributors, error: distributorError } = await supabase
          .from("Distributors")
          .select("DistributorIDNO, RegisteredDPC")
          .in("DistributorIDNO", distributorIDs);
    
        if (distributorError) {
          console.error("Error fetching distributors:", distributorError);
          this.loading = false;
          return;
        }
    
        // Create a map for fast lookup of RegisteredDPC based on DistributorIDNO
        const distributorMap = Object.fromEntries(
          distributors.map(d => [d.DistributorIDNO, d.RegisteredDPC || "Unknown"])
        );
    
        // Call the function to compute totals per DPC
        this.dpcSummary = this.computeDPCSummary(bonuses, distributorMap);
    
        console.log("DPC Summary:", this.dpcSummary);
        this.loading = false;
      } catch (error) {
        console.error("Error fetching data:", error);
        this.loading = false;
      }
    },

    async fetchPaidBonusesByPaymentDate(startDate, endDate) {
      const today = new Date();
      const todayKey = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
      const rangeStart = startDate || endDate || todayKey;
      const rangeEnd = endDate || startDate || todayKey;
      this.paidPaymentsDateRange = { startDate: rangeStart, endDate: rangeEnd };
      const [endYear, endMonth, endDay] = rangeEnd.split("-").map(Number);
      const dayAfterEnd = new Date(endYear, endMonth - 1, endDay + 1);
      const exclusiveEnd = [
        dayAfterEnd.getFullYear(),
        String(dayAfterEnd.getMonth() + 1).padStart(2, "0"),
        String(dayAfterEnd.getDate()).padStart(2, "0"),
      ].join("-");
      const paidBonuses = [];
      const pageSize = 1000;
      let offset = 0;

      try {
        while (true) {
          const { data, error } = await supabase
            .from("Bonus")
            .select("id, DistributorIDNO, BonusValue, BonusDate, PaymentDate, PaidBy, Status")
            .eq("Status", "Paid")
            .gte("PaymentDate", `${rangeStart}T00:00:00`)
            .lt("PaymentDate", `${exclusiveEnd}T00:00:00`)
            .range(offset, offset + pageSize - 1);

          if (error) throw error;
          paidBonuses.push(...(data || []));
          if (!data || data.length < pageSize) break;
          offset += pageSize;
        }

        const distributorIDs = [...new Set(paidBonuses.map((bonus) => bonus.DistributorIDNO))];
        const distributorDpc = new Map();
        for (let index = 0; index < distributorIDs.length; index += 200) {
          const { data, error } = await supabase
            .from("Distributors")
            .select("DistributorIDNO, RegisteredDPC")
            .in("DistributorIDNO", distributorIDs.slice(index, index + 200));

          if (error) throw error;
          for (const distributor of data || []) {
            distributorDpc.set(distributor.DistributorIDNO, distributor.RegisteredDPC);
          }
        }

        this.todayPaidBonuses = paidBonuses
          .map((bonus) => ({
            ...bonus,
            RegisteredDPC: distributorDpc.get(bonus.DistributorIDNO) || null,
          }));
      } catch (error) {
        console.error("Error fetching today's paid bonuses:", error);
      }
    },

    async refreshTodayPaidBonuses() {
      const today = new Date();
      const todayKey = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
      await this.fetchPaidBonusesByPaymentDate(todayKey, todayKey);
    },

    subscribeToTodayPaidBonuses() {
      if (this.todayPaymentsSubscription) return;

      this.todayPaymentsSubscription = supabase
        .channel("TodayPaidBonusUpdates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "Bonus" },
          () => this.refreshTodayPaidBonuses()
        )
        .subscribe();
    },

    unsubscribeFromTodayPaidBonuses() {
      if (!this.todayPaymentsSubscription) return;

      supabase.removeChannel(this.todayPaymentsSubscription);
      this.todayPaymentsSubscription = null;
    },
    

 // **Fetch DPCs for the current user's department**

async fetchDPCs1() {
  const storeAuth = useStoreAuth();
  const userDepartment = storeAuth.userDetails?.department;

  if (!userDepartment) {
    console.error("Department not found in authStore!");
    return;
  }

  try {
    const { data, error } = await supabase
      .from("dpc")
      .select("dpccode, dpcname")
      .eq("department", userDepartment);

    if (error) throw error;

    this.Dpcs = data || []; // Ensure the Dpcs array gets populated
    //console.log("Fetched DPCs:", this.Dpcs); // Debugging
  } catch (err) {
    console.error("Error fetching DPCs:", err.message);
  }
},

  // Action to fetch DPCs based on departmentType
  async fetchDPCs() {
    const storeAuth = useStoreAuth();
    const userDepartment = storeAuth.userDetails?.department;
  
    if (!userDepartment && this.departmentType === 'my-department') {
      console.error("Department not found in authStore!");
      return;
    }
  
    try {
      let query = supabase.from("dpc").select("dpccode, dpcname");
  
      // If departmentType is 'my-department', filter by userDepartment
      if (this.departmentType === 'my-department') {
        query = query.eq("department", userDepartment);
      }
  
      // If departmentType is 'all-dpcs', fetch all DPCs (no department filter)
      
      const { data, error } = await query;
  
      if (error) throw error;
  
      this.Dpcs = data || [];  // Populate Dpcs array
      if (this.Dpcs.length > 0) {
        this.selectedDPC = this.Dpcs[0].dpccode; // Auto-select first DPC
      }
    } catch (err) {
      console.error("Error fetching DPCs:", err.message);
    }
  },
  

async fetchBonusAggregate(startDate, endDate) {
  const storeAuth = useStoreAuth()
  const department = storeAuth.userDetails?.department // Get department

  console.log("Retrieved department:", department) // Debugging log

  if (!department) {
    console.error("User department is not available.")
    return
  }

  // Check if startDate and endDate are valid (not empty or invalid)
  if (!startDate || !endDate || startDate === "" || endDate === "") {
    console.error("Invalid date range: startDate or endDate is empty.");
    return; // Return early if dates are invalid
  }

  // Format startDate and endDate to 'YYYY-MM-DD'
  const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
  const formattedEndDate = new Date(endDate).toISOString().split('T')[0];

  console.log("Formatted Start Date:", formattedStartDate); // Debugging log
  console.log("Formatted End Date:", formattedEndDate); // Debugging log

  this.loading = true // Start loading state

  try {
    // Fetch the aggregated bonus data using the provided date range and department
    const { data, error: fetchError } = await supabase.rpc('get_bonus_summary', { 
      start_date: formattedStartDate, 
      end_date: formattedEndDate, 
      department_name: department 
    });

    this.loading = false // Stop loading

    if (fetchError) {
      console.error('Error fetching bonus aggregate:', fetchError);
      return
    }

    aggregateBonus.value = data // Store fetched data
  } catch (error) {
    this.loading = false // Stop loading in case of a general error
    console.error('Unexpected error:', error);
  }
},
//here is where i fetch shop summaries
    async fetchBonusSummary(startDate, endDate) {
      const storeAuth = useStoreAuth()
      const department = storeAuth.userDetails?.department

      if (!department) {
        console.error("User department is not available.")
        return
      }

      this.loading = true
      const { data, error } = await supabase
        .rpc('get_bonus_summary', {
          start_date: startDate,
          end_date: endDate,
          department_name: department
        })
      this.loading = false

      if (error) {
        console.error('Error fetching bonus summary:', error)
        return
      }

      this.bonusData = data
    },

    async summarizeAll(startDate, endDate) {
      this.loading = true
      const { data, error } = await supabase
        .rpc('get_all_bonus_summary', {
          start_date: startDate,
          end_date: endDate
        })
      this.loading = false

      if (error) {
        console.error('Error fetching all DPCs bonus summary:', error)
        return
      }

      this.bonusData = data
    },
    
  
  
    async updateStatus1(id) {
      const now = new Date();
      const currentDateTime = now.toISOString().split("T")[0] + " " + now.toTimeString().split(" ")[0];
    
      const storeAuth = useStoreAuth();
      const paidBy = storeAuth.userDetails?.username || "Unknown";
    
      const { error } = await supabase
        .from("Bonus")
        .update({ Status: "Paid", PaymentDate: currentDateTime, PaidBy: paidBy, user_id: storeAuth.userDetails.id })
        .eq("id", id);
    
      if (!error) {
        const index = this.bonuses.findIndex((b) => b.id === id);
        if (index !== -1) {
          this.bonuses[index].Status = "Paid";
          this.bonuses[index].PaymentDate = currentDateTime;
          this.bonuses[index].PaidBy = paidBy;
        }
      } else {
        console.error("Error updating status:", error);
      }
    },

    async updateStatus2(id) {
      const now = new Date();
      const currentDateTime = now.toISOString().split("T")[0] + " " + now.toTimeString().split(" ")[0];
      
      const storeAuth = useStoreAuth();
      const paidBy = storeAuth.userDetails?.username || "Unknown";
    
      // Find the index and store the previous state for rollback
      const index = this.bonuses.findIndex((b) => b.id === id);
      if (index !== -1) {
        const previousBonus = { ...this.bonuses[index] }; // Save previous state for rollback
    
        // Immediate local update
        this.bonuses[index].Status = "Paid";
        this.bonuses[index].PaymentDate = currentDateTime;
        this.bonuses[index].PaidBy = paidBy;
        localStorage.setItem('bonuses', JSON.stringify(this.bonuses));
    
        // Attempt update in Supabase (in background)
        const { error } = await supabase
          .from("Bonus")
          .update({ Status: "Paid", PaymentDate: currentDateTime, PaidBy: paidBy, user_id: storeAuth.userDetails.id })
          .eq("id", id);
    
        if (error) {
          console.error("Error updating status:", error);
    
          // Rollback local changes if Supabase update fails
          this.bonuses[index] = previousBonus;
          localStorage.setItem('bonuses', JSON.stringify(this.bonuses)); // Restore previous state in localStorage
        }
      }
    },
    async updateStatus(id) {
      const now = new Date();
      const localDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
      const localTime = [now.getHours(), now.getMinutes(), now.getSeconds()].map((value) => String(value).padStart(2, "0")).join(":");
      const currentDateTime = `${localDate} ${localTime}`;
    
      const storeAuth = useStoreAuth();
      const paidBy = storeAuth.userDetails?.username || "Unknown";
    
      // ✅ Ensure TakenBy is never null or empty
       const takenBy = this.takenBy && this.takenBy.trim() ? this.takenBy.trim() : "N/A";
    
      // Find the index and store the previous state for rollback
      const index = this.bonuses.findIndex((b) => b.id === id);
      if (index !== -1) {
        const previousBonus = { ...this.bonuses[index] }; // Save previous state for rollback
    
        const todayPaymentIndex = this.todayPaidBonuses.findIndex((bonus) => bonus.id === id);
        const previousTodayPayment = todayPaymentIndex >= 0
          ? { ...this.todayPaidBonuses[todayPaymentIndex] }
          : null;
        const localToday = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
        const todayPayment = {
          id,
          DistributorIDNO: previousBonus.DistributorIDNO,
          BonusValue: previousBonus.BonusValue,
          BonusDate: previousBonus.BonusDate,
          PaymentDate: currentDateTime,
          Status: "Paid",
          RegisteredDPC: previousBonus.RegisteredDPC,
        };

        // Immediate local update
        this.bonuses[index].Status = "Paid";
        this.bonuses[index].PaymentDate = currentDateTime;
        this.bonuses[index].PaidBy = paidBy;
        this.bonuses[index].PickedBy = takenBy; // ✅ Use `this.takenBy`
        localStorage.setItem("bonuses", JSON.stringify(this.bonuses));
        if (localToday === currentDateTime.slice(0, 10)) {
          if (todayPaymentIndex >= 0) {
            this.todayPaidBonuses[todayPaymentIndex] = todayPayment;
          } else {
            this.todayPaidBonuses.push(todayPayment);
          }
        }
    
        // Attempt update in Supabase (in background)
        const { error } = await supabase
          .from("Bonus")
          .update({
            Status: "Paid",
            PaymentDate: currentDateTime,
            PaidBy: paidBy,
            PickedBy: takenBy, // ✅ Update PickedBy in Supabase
            user_id: storeAuth.userDetails.id,
          })
          .eq("id", id);
    
        if (error) {
          console.error("Error updating status:", error);
    
          // Rollback local changes if Supabase update fails
          this.bonuses[index] = previousBonus;
          localStorage.setItem("bonuses", JSON.stringify(this.bonuses)); // Restore previous state in localStorage
          this.todayPaidBonuses = this.todayPaidBonuses.filter((bonus) => bonus.id !== id);
          if (previousTodayPayment) {
            this.todayPaidBonuses.splice(todayPaymentIndex, 0, previousTodayPayment);
          }
        } else {
          await this.refreshTodayPaidBonuses();
        }
      }
    },

    async updateTakenBy(id, takenBy) {
      if (!id) return;
    
      takenBy = takenBy?.trim() || "N/A"; // Ensure no empty values
    
      const { error } = await supabase
        .from("Bonus")
        .update({ PickedBy: takenBy }) // Only update PickedBy column
        .eq("id", id);
    
      if (error) {
        console.error("Error updating TakenBy:", error.message);
      } else {
        console.log("TakenBy updated successfully:", takenBy);
      }
    },
    
    
    
    
    async reverseStatus1(id) {
      const storeAuth = useStoreAuth();
      const now = new Date();
      const currentDateTime = now.toISOString().split("T")[0] + " " + now.toTimeString().split(" ")[0];
      const { error } = await supabase
        .from("Bonus")
        .update({ Status: "UnPaid", PaymentDate: currentDateTime, PaidBy: "", user_id: storeAuth.userDetails.id })
        .eq("id", id);
    
      if (!error) {
        const index = this.bonuses.findIndex((b) => b.id === id);
        if (index !== -1) {
          this.bonuses[index].Status = "UnPaid";
          this.bonuses[index].PaymentDate = currentDateTime;
          this.bonuses[index].PaidBy = "";
        }
      } else {
        console.error("Error reverting status:", error);
      }
    },

    async reverseStatus(id) {
      const storeAuth = useStoreAuth();
      const now = new Date();
      const currentDateTime = now.toISOString().split("T")[0] + " " + now.toTimeString().split(" ")[0];
    
      // Find the index and store the previous state for rollback
      const index = this.bonuses.findIndex((b) => b.id === id);
      if (index !== -1) {
        const previousBonus = { ...this.bonuses[index] }; // Save previous state for rollback
    
        const todayPaymentIndex = this.todayPaidBonuses.findIndex((bonus) => bonus.id === id);
        const previousTodayPayment = todayPaymentIndex >= 0
          ? { ...this.todayPaidBonuses[todayPaymentIndex] }
          : null;

        // Immediate local update (optimistic update)
        this.bonuses[index].Status = "UnPaid";
        this.bonuses[index].PaymentDate = currentDateTime;
        this.bonuses[index].PaidBy = "";
        localStorage.setItem('bonuses', JSON.stringify(this.bonuses));
        if (todayPaymentIndex >= 0) {
          this.todayPaidBonuses.splice(todayPaymentIndex, 1);
        }
    
        // Attempt update in Supabase (in the background)
        const { error } = await supabase
          .from("Bonus")
          .update({ Status: "UnPaid", PaymentDate: currentDateTime, PaidBy: "", user_id: storeAuth.userDetails.id })
          .eq("id", id);
    
        if (error) {
          console.error("Error reverting status:", error);
    
          // Rollback local changes if Supabase update fails
          this.bonuses[index] = previousBonus;
          if (previousTodayPayment && !this.todayPaidBonuses.some((bonus) => bonus.id === id)) {
            this.todayPaidBonuses.splice(todayPaymentIndex, 0, previousTodayPayment);
          }
          localStorage.setItem('bonuses', JSON.stringify(this.bonuses)); // Restore previous state in localStorage
        } else {
          await this.refreshTodayPaidBonuses();
        }
      }
    },
    

   
    async fetchBonusPivotTable(startDate, endDate) {
      const storeAuth = useStoreAuth();  // Reference to authentication store
      const department = storeAuth.userDetails?.department;
    
      if (!department) {
        console.error("User department is not available.");
        return;
      }
    
      // ✅ Ensure startDate and endDate are provided
      if (!startDate || !endDate) {
        console.error("Error: Missing start or end date.", { startDate, endDate });
        return;
      }
    
      try {
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);
    
        // ✅ Validate date parsing
        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
          console.error("Error: Invalid date format.", { startDate, endDate });
          return;
        }
    
        const formattedStartDate = parsedStartDate.toISOString().split("T")[0];
        const formattedEndDate = parsedEndDate.toISOString().split("T")[0];
    
        console.log("Fetching pivot data from:", formattedStartDate, "to", formattedEndDate);
    
        const { data, error } = await supabase.rpc("get_bonus_pivot_table", {
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          department_name: department,
        });
    
        if (error) {
          console.error("Error fetching bonus pivot table:", error);
          return;
        }
    
        console.log("Fetched bonus pivot data:", data);
    
        // ✅ Process data
        const pivotTable = {};
        const dpcSet = new Set();
    
        data.forEach(({ payment_date, dpc, totalpaidbonus }) => {
          if (!pivotTable[payment_date]) {
            pivotTable[payment_date] = {};
          }
          pivotTable[payment_date][dpc] = totalpaidbonus || 0;
          dpcSet.add(dpc);
        });
    
        // ✅ Store data in Pinia state (set values directly in the store)
        this.setPivotBonusData(pivotTable);
        this.setDpcNames(Array.from(dpcSet).sort());
    
        console.log("Transformed Pivot Table:", pivotTable);
    
      } catch (error) {
        console.error("Unexpected error while fetching data:", error);
      }
    },
    setPivotBonusData(data) {
      this.pivotBonusData = data;
    },
    setDpcNames(names) {
      this.dpcNames = names;
    },
  
    
    
    
    clearEntries() {
      this.bonuses = [];
      this.dpcNames = [];
    },
  
  clearEntries(){
this.bonuses.value=[]
  },

    subscribeToBonuses() {
      if (this.subscription) {
        console.log("Already subscribed to bonus updates.");
        return;
      }

      this.subscription = supabase
        .channel("BonusUpdates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "Bonus" },
          (payload) => {
            console.log("Bonus table updated:", payload);
            this.fetchPaidBonusesByPaymentDate(
              this.paidPaymentsDateRange.startDate,
              this.paidPaymentsDateRange.endDate
            );
            this.fetchBonuses(
              this.bonusQuery.startDate,
              this.bonusQuery.endDate,
              this.bonusQuery.distributorID,
              this.bonusQuery.selectedDpc
            );
          }
        )
        .subscribe();
    },

    unsubscribeFromBonuses() {
      if (this.subscription) {
        supabase.removeChannel(this.subscription);
        this.subscription = null;
        //console.log("Unsubscribed from bonus updates.");
      }
    },
  },
 
});
