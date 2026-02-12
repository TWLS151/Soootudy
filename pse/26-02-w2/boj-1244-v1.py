T = int(input())

for tc in range(1, T+1):
    N = int(input())    # 스위치 길이
    switch = list(map(int, input().split()))    # 스위치 상태 나타내는 리스트
    M = int(input())    # 학생 수

    for _ in range(M):
        gender, num = map(int, input().split())     # 성별, 각자 받은 번호

        if gender == 1:  # 1) 남학생: 남학생은 받은 번호의 "배수" 스위치를 전부 뒤집는다.
            for i in range(num-1, N, num):  # switch 리스트는 0번부터 시작하기 때문에 num-1부터 시작
                if switch[i] == 0:
                    switch[i] = 1
                else:
                    switch[i] = 0

        # 2) 여학생일 때 (여기서 막혔었음..)
        # 여학생은 "자기 번호를 중심"으로 좌우 대칭을 확인한다.
        else:   
            center = num - 1    # 중심 인덱스
            if switch[center] == 0:      # 중심 스위치는 무조건 먼저 반전하기!
                switch[center] = 1
            else:
                switch[center] = 0

            num1 = center - 1    # 좌우 한 칸씩 확장
            num2 = center + 1

            # 범위 안이고, 좌우 값이 같으면 계속 확장
            while num1 >= 0 and num2 < N and switch[num1] == switch[num2]:
                if switch[num1] == 0:
                    switch[num1] = 1
                    switch[num2] = 1
                else:
                    switch[num1] = 0
                    switch[num2] = 0
                
                num1 -= 1   # 바깥쪽으로 한 칸 더 이동
                num2 += 1

    print(f'#{tc} {switch}')

'''
Docstring for IM_대비_문제.bj_스위치켜고끄기
# 문제 정의
스위치가 나열되어 있는데
> 0 1 0 1 0 0 0 1
학생 순서대로 스위치 바꾸면서 최종 스위치 상태 출력하기

- 남학생: 받은 번호의 배수인 스위치 번호의 상태 바꿈. (켜져있으면 끄고, 꺼져있으면 켜기)
- 여학생: 받은 번호와 같은 스위치를 중심으로,
         좌우대칭이면서 가장 많은 스위치를 포함하는 구간에 속한 스위치 상태 모두 바꿈
         (만약 4번 중심으로 3,5번 대칭 아니면 그냥 4번만 상태 바꿈.)
'''
