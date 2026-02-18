# IM 기출
# BOJ-1244 스위치 켜고 끄기


N = int(input())
switch = list(map(int, input().split()))
M = int(input())
students = [list(map(int, input().split())) for _ in range(M)]

for gender, switch_num in students:
    # 남학생
    if gender == 1:
        """
        for i in range(1, N // switch_num + 1):
            num = switch_num * i - 1
            switch[num] = 1 - switch[num]
        
        # range의 step 인자 활용
        """
        for i in range(switch_num - 1, N, switch_num):
            switch[i] = 1 - switch[i]
        
    # 여학생
    else:
        # [PITFALL] 인덱스 넘버로 변경
        idx_num = switch_num - 1
        switch[idx_num] = 1 - switch[idx_num]
        j = 1

        while (idx_num - j >= 0 and idx_num + j < N
                and switch[idx_num - j] == switch[idx_num + j]):
            """
            switch[idx_num + j] = 1 - switch[idx_num + j]
            switch[idx_num - j] = 1 - switch[idx_num - j]
                
            # 한 줄로 합치기
            """
            switch[idx_num + j] = switch[idx_num - j] = 1 - switch[idx_num - j]
            j += 1
    
"""
K = N // 20
for k in range(K):
    switch_20 = switch[k*20:(k+1)*20]
    print(*switch_20)
print(*switch[K*20:])
    
# range의 step 인자 활용
"""
for k in range(0, N, 20):
    print(*switch[k:k+20])
