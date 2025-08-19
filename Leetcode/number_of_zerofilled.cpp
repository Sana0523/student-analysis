// number_of_zerofilled.cpp
// LeetCode Problem: Count the number of subarrays filled with zeros
// Problem: https://leetcode.com/problems/count-number-of-zerofilled-subarrays/
// This problem requires counting the number of contiguous subarrays that consist entirely of zeros.
// The solution iterates through the input array, maintaining a count of consecutive zeros. Whenever a zero is encountered, it increments the count and adds it to the total count of zero-filled subarrays. If a non-zero element is encountered, it resets the count to zero.
class Solution {
public:
    long long zeroFilledSubarray(vector<int>& nums) {
        long long x=0;
        long long cnt=0;
        for(int i=0;i<nums.size();i++)
        {
            if(nums[i]==0)
            {
                x++;
                cnt+=x;
            }
            else
            {
                x=0;
            }
        }
        return cnt;
    }
};