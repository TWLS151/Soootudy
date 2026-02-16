N = int(input())  # 스위치 개수
switch_list = list(map(int, input().split()))  # 스위치 현재 상태(켜져 있으면 1)
n_student = int(input())  # 학생 수
student_info = [list(map(int, input().split())) for r in range(n_student)] # 성별(남자 1, 여자 2), 학생이 받은 숫자

        
for i in range(n_student):
    gender = student_info[i][0]
    received_number = student_info[i][1]
    
    if gender == 1:  # 남자
        for j in range(N):
            if (j+1)%received_number == 0:
                switch_list[j] = int(not switch_list[j])

    else:  # 여자
        switch_list[received_number-1] = int(not switch_list[received_number-1])
        if received_number <= N//2:
            for k in range(1,received_number):
                if switch_list[received_number-1-k] == switch_list[received_number-1+k]:
                    switch_list[received_number-1-k] = int(not switch_list[received_number-1-k])
                    switch_list[received_number-1+k] = int(not switch_list[received_number-1+k])
                else:
                    break
        else:
            for k in range(1,N-received_number+1):
                if switch_list[received_number-1-k] == switch_list[received_number-1+k]:
                    switch_list[received_number-1-k] = int(not switch_list[received_number-1-k])
                    switch_list[received_number-1+k] = int(not switch_list[received_number-1+k])
                else:
                    break

for i in range(0,N,20):
    print(' '.join(map(str,switch_list[i:i+20])))