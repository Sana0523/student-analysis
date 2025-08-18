class Solution {
public:
    int maxhist(vector<int>& heights)
    {
        stack <int> st;
        int maxarea=INT_MIN,i;
        int n=heights.size();
        for(i=0;i<n;i++)
        {
            while(!st.empty() && heights[i]<heights[st.top()])
            {
                int e=st.top();
                st.pop();
                int nse=i;
                int pse=st.empty()?-1:st.top();
                maxarea=max((heights[e]*(nse-pse-1)),maxarea);
            }
            st.push(i);
        }
        while(!st.empty())
            {
                int e=st.top();
                st.pop();
                int nse=n;
                int pse=st.empty()?-1:st.top();
                maxarea=max(heights[e]*(nse-pse-1),maxarea);
            }
        return maxarea;
    }

    int maximalRectangle(vector<vector<char>>& matrix) {
        int m=matrix.size();
        int n=matrix[0].size();
        int maxarea=0;
        vector<vector<int>> prefix_sum(m,vector<int>(n,0));
        for(int i=0;i<m;i++)
        {
            for(int j=0;j<n;j++)
            {
                if(matrix[i][j]=='1')
                    prefix_sum[i][j]+=(i==0)?1:prefix_sum[i-1][j]+1;
                else
                    prefix_sum[i][j]=0;
            }
        }
        for(int i=0;i<m;i++)
            maxarea=max(maxarea,maxhist(prefix_sum[i]));
        return maxarea;
    }
};